/**
 * FHIR R4 shapes for a referral, following HL7 BSeR: a ServiceRequest for the referral, a Task that tracks it between
 * organizations, and one Consent per recipient listing the sections she shares. v1 still delivers by e-fax or Direct
 * (360X); these are what a FHIR-capable office receives, and keep the record standards-shaped from day one.
 */
import { SPECIALTY } from "./labels";
import type { Consent, Referral, ReferralStatus, World } from "./types";

type TaskStatus = "draft" | "requested" | "received" | "accepted" | "in-progress" | "completed" | "on-hold";

const TASK_STATUS: Record<ReferralStatus, TaskStatus> = {
  draft: "draft",
  sent: "requested",
  needs_info: "on-hold",
  qualified: "received",
  insurance_pending: "on-hold",
  insurance_issue: "on-hold",
  on_waitlist: "accepted",
  offered: "accepted",
  booked: "in-progress",
  seen: "in-progress",
  summary_received: "completed",
  closed: "completed",
};

const REQUEST_STATUS: Record<ReferralStatus, "draft" | "active" | "completed"> = {
  draft: "draft",
  sent: "active",
  needs_info: "active",
  qualified: "active",
  insurance_pending: "active",
  insurance_issue: "active",
  on_waitlist: "active",
  offered: "active",
  booked: "active",
  seen: "active",
  summary_received: "completed",
  closed: "completed",
};

export interface FhirBundle {
  resourceType: "Bundle";
  type: "collection";
  entry: { fullUrl: string; resource: Record<string, unknown> }[];
}

function consentResource(patientId: string, recipientId: string, rows: Consent[]) {
  const active = rows.filter((c) => c.revokedAt === null);
  return {
    resourceType: "Consent",
    id: `${patientId}-${recipientId}`,
    status: active.length > 0 ? "active" : "inactive",
    scope: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/consentscope", code: "patient-privacy" }] },
    category: [{ coding: [{ system: "http://loinc.org", code: "59284-0" }] }],
    patient: { reference: `Patient/${patientId}` },
    dateTime: rows.map((c) => c.grantedAt).sort()[0],
    provision: {
      type: "permit",
      actor: [{ role: { text: "recipient" }, reference: { reference: `Organization/${recipientId}` } }],
      data: active.map((c) => ({ meaning: "related", reference: { display: c.section } })),
    },
  };
}

export function toFhirBundle(w: World, r: Referral): FhirBundle {
  const patient = `Patient/${r.patientId}`;
  const slot = r.slotId ? w.slots.find((s) => s.id === r.slotId) : undefined;
  const performer = slot?.practiceId ?? r.faxPracticeId;
  const summary = r.summaryId ? w.summaries.find((s) => s.id === r.summaryId) : undefined;

  const serviceRequest = {
    resourceType: "ServiceRequest",
    id: r.id,
    status: REQUEST_STATUS[r.status],
    intent: "order",
    priority: r.urgent ? "urgent" : "routine",
    category: [{ text: "Referral" }],
    code: { text: `Referral to ${SPECIALTY[r.specialty].label}` },
    subject: { reference: patient },
    requester: { reference: `Organization/${r.pcpId}`, display: r.signature?.signer },
    ...(performer ? { performer: [{ reference: `Organization/${performer}` }] } : {}),
    reasonCode: [{ text: r.reason }],
    ...(slot ? { occurrenceDateTime: slot.startsAt } : {}),
    ...(r.signature ? { authoredOn: r.signature.at } : {}),
  };
  const task = {
    resourceType: "Task",
    id: `${r.id}-task`,
    status: TASK_STATUS[r.status],
    intent: "order",
    focus: { reference: `ServiceRequest/${r.id}` },
    for: { reference: patient },
    ...(r.missing.length ? { statusReason: { text: `Missing: ${r.missing.join("; ")}` } } : {}),
    ...(summary ? { output: [{ type: { text: "Visit summary" }, valueString: summary.text }] } : {}),
  };

  const byRecipient = new Map<string, Consent[]>();
  for (const c of w.consents.filter((x) => x.patientId === r.patientId)) {
    byRecipient.set(c.recipientId, [...(byRecipient.get(c.recipientId) ?? []), c]);
  }
  const consents = [...byRecipient].map(([recipientId, rows]) => consentResource(r.patientId, recipientId, rows));

  return {
    resourceType: "Bundle",
    type: "collection",
    entry: [serviceRequest, task, ...consents].map((resource) => ({
      fullUrl: `urn:attune:${resource.resourceType}/${resource.id}`,
      resource,
    })),
  };
}
