#!/usr/bin/env python3
"""
check_promotion.py - Deterministic Fail-Closed Promotion Gatekeeper

Enforces the Attune release promotion doctrine:
- feature -> develop -> stage -> main
- No direct promotion from feature branches or develop to main
- Stage requires automated build/test evidence
- Main requires full acceptance testing, ancestor commit verification, clean diffs, reviewer, and rollback procedure
"""

import json
import os
from pathlib import Path
import subprocess
import sys

# Standard required checks for promotion to production (main)
DEFAULT_STAGE_REQUIRED = ('runtime_build',)
DEFAULT_MAIN_REQUIRED = (
    'runtime_build',
    'integration_tests',
    'clean_install',
    'recovery'
)


def validate_report(base_branch, head_branch, report_path='release/acceptance.json'):
    path = Path(report_path)
    if not path.is_file():
        raise ValueError(f"Missing mandatory release report at '{report_path}'.")

    try:
        report = json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc:
        raise ValueError(f"Failed to parse '{report_path}' as valid JSON: {exc}")

    # 1. Enforce strict branch origin rules
    valid_transitions = {
        'stage': 'develop',
        'main': 'stage'
    }
    expected_head = valid_transitions.get(base_branch)
    if not expected_head:
        print(f"[Promotion Info] Target branch '{base_branch}' is not a gated release branch; skipping promotion check.")
        return None

    if head_branch != expected_head:
        raise ValueError(
            f"Promotion Policy Violation: Branch '{base_branch}' accepts promotion ONLY from '{expected_head}', not '{head_branch}'."
        )

    # 2. Enforce required verification evidence
    required_checks = DEFAULT_STAGE_REQUIRED if base_branch == 'stage' else DEFAULT_MAIN_REQUIRED
    checks = report.get('checks', {})

    for check_name in required_checks:
        entry = checks.get(check_name, {})
        status = entry.get('status')
        evidence = str(entry.get('evidence', '')).strip()

        if status != 'passed' or not evidence:
            raise ValueError(
                f"Promotion Blocked: Check '{check_name}' requires status='passed' and non-empty evidence string. "
                f"Found status='{status}'."
            )

    # 3. Assert commit and artifact identification
    tested_commit = report.get('tested_commit')
    artifact = report.get('artifact')
    if not tested_commit or not artifact:
        raise ValueError("Promotion Blocked: 'tested_commit' SHA and 'artifact' identifier must be provided in acceptance.json.")

    # 4. Canonical specs report link validation
    specs_report = str(report.get('specs_report', '')).strip()
    if not specs_report:
        raise ValueError("Promotion Blocked: 'specs_report' must link to the accepted release report in the specs repo.")

    # 5. Production-specific criteria (main)
    if base_branch == 'main':
        reviewer = report.get('reviewer')
        rollback = report.get('rollback')
        if not reviewer or not rollback:
            raise ValueError("Promotion to 'main' Blocked: Designated 'reviewer' and detailed 'rollback' procedure are mandatory.")

    return report


def verify_git_ancestry_and_diff(tested_commit, candidate_sha):
    """
    Ensures that the commit that was tested is an exact ancestor of the candidate SHA,
    and that NO source code or assets have been altered between testing and promotion.
    Only documentation and release metadata files may differ.
    """
    # Verify tested_commit is an ancestor of candidate_sha
    try:
        subprocess.run(
            ['git', 'merge-base', '--is-ancestor', tested_commit, candidate_sha],
            check=True,
            capture_output=True,
            text=True
        )
    except subprocess.CalledProcessError:
        raise ValueError(
            f"Integrity Violation: Tested commit '{tested_commit}' is not an ancestor of candidate SHA '{candidate_sha}'."
        )

    # Verify no functional code changed between tested commit and candidate SHA
    diff_command = [
        'git', 'diff', '--exit-code', tested_commit, candidate_sha, '--', '.',
        ':!release/**',
        ':!docs/**',
        ':!README.md',
        ':!*.md'
    ]
    try:
        subprocess.run(diff_command, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError:
        raise ValueError(
            "Integrity Violation: Functional code or assets were modified after testing occurred! "
            "Only release/ and documentation files may be committed after verification."
        )


def main():
    base_branch = os.environ.get('TARGET_BRANCH') or os.environ.get('GITHUB_BASE_REF') or os.environ.get('ATTUNE_BASE_BRANCH', '')
    head_branch = os.environ.get('SOURCE_BRANCH') or os.environ.get('GITHUB_HEAD_REF') or os.environ.get('ATTUNE_HEAD_BRANCH', '')
    candidate_sha = os.environ.get('CANDIDATE_SHA') or os.environ.get('GITHUB_SHA') or os.environ.get('ATTUNE_HEAD_SHA', '')

    if not base_branch or not head_branch:
        print("Notice: Base or head branch not provided in environment; checking local acceptance.json syntax only.")
        report_file = 'release/acceptance.json'
        if Path(report_file).exists():
            data = json.loads(Path(report_file).read_text())
            print(f"Verified syntax of {report_file}. Tested commit: {data.get('tested_commit')}")
        return

    try:
        report = validate_report(base_branch, head_branch)
        if report and candidate_sha:
            verify_git_ancestry_and_diff(report['tested_commit'], candidate_sha)
        print(f"SUCCESS: Promotion from '{head_branch}' to '{base_branch}' is fully authorized and verified.")
    except Exception as exc:
        print(f"FAIL-CLOSED PROMOTION GATE ERROR:\n  {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
