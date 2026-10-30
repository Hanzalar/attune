/**
 * FHIR R4 shapes for a referral, following the HL7 BSeR (Bidirectional Services eReferrals) pattern:
 * a ServiceRequest for the referral itself and a Task that tracks its status between organizations,
 * plus the patient's Consent. v1 still delivers by e-fax or Direct; these resources are what a
 * FHIR-capable office (v2) receives, and what we log so the record stays standards-shaped from day one.
 */
import type { Referral, Specialist, Stage } from "./types";

const ICD10 = "http://hl7.org/fhir/sid/icd-10-cm";
const NPI = "http://hl7.org/fhir/sid/us-npi";

type TaskStatus = "draft" | "requested" | "accepted" | "in-progress" | "completed" | "rejected" | "cancelled";

const TASK_STATUS: Record<Stage, TaskStatus> = {
  draft: "draft",
  awaiting_pcp: "draft",
  awaiting_physician: "draft",
  signed: "draft",
  sent: "requested",
  offered: "accepted",
  booked: "in-progress",
  visited: "in-progress",
  closed: "completed",
  declined: "rejected",
  withdrawn: "cancelled",
};

const REQUEST_STATUS: Record<Stage, "draft" | "active" | "completed" | "revoked"> = {
  draft: "draft",
  awaiting_pcp: "draft",
  awaiting_physician: "draft",
  signed: "active",
  sent: "active",
  offered: "active",
  booked: "active",
  visited: "active",
  closed: "completed",
  declined: "revoked",
  withdrawn: "revoked",
};

export interface FhirBundle {
  resourceType: "Bundle";
  type: "collection";
  entry: { fullUrl: string; resource: Record<string, unknown> }[];
}

export function toFhirBundle(r: Referral, specialist: Specialist, codeDisplays: Record<string, string> = {}): FhirBundle {
  const patient = `Patient/${r.patientRef}`;
  const serviceRequest = {
    resourceType: "ServiceRequest",
    id: r.id,
    status: REQUEST_STATUS[r.stage],
    intent: "order",
    category: [{ text: "Referral" }],
    code: { text: `Referral to ${r.toSpecialty}` },
    subject: { reference: patient },
    requester: { display: r.fromPractice },
    performer: [{ identifier: { system: NPI, value: specialist.npi }, display: specialist.name }],
    reasonCode: r.codes.map((code) => ({ coding: [{ system: ICD10, code, display: codeDisplays[code] }] })),
    supportingInfo: [{ reference: `DocumentReference/${r.id}-packet` }],
    ...(r.requestedSlot ? { occurrenceDateTime: r.requestedSlot.at } : {}),
  };
  const task = {
    resourceType: "Task",
    id: `${r.id}-task`,
    status: TASK_STATUS[r.stage],
    intent: "order",
    focus: { reference: `ServiceRequest/${r.id}` },
    for: { reference: patient },
    owner: { identifier: { system: NPI, value: specialist.npi } },
    ...(r.note ? { statusReason: { text: r.note } } : {}),
    ...(r.outcome ? { output: [{ type: { text: "Visit outcome" }, valueString: r.outcome }] } : {}),
  };
  const consent = {
    resourceType: "Consent",
    id: `${r.id}-consent`,
    status: r.consent.revokedAt ? "inactive" : r.consent.grantedAt ? "active" : "proposed",
    scope: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/consentscope", code: "patient-privacy" }] },
    category: [{ coding: [{ system: "http://loinc.org", code: "59284-0" }] }],
    patient: { reference: patient },
    ...(r.consent.grantedAt ? { dateTime: r.consent.grantedAt } : {}),
    provision: {
      type: "permit",
      actor: [{ role: { text: "recipient" }, reference: { identifier: { system: NPI, value: specialist.npi } } }],
      data: (Object.keys(r.share) as (keyof Referral["share"])[])
        .filter((k) => r.share[k])
        .map((k) => ({ meaning: "related", reference: { display: k } })),
    },
  };
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: [serviceRequest, task, consent].map((resource) => ({
      fullUrl: `urn:attune:${resource.resourceType}/${resource.id}`,
      resource,
    })),
  };
}
