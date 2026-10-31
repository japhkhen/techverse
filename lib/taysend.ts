import { toE164Ghana } from "@/lib/phone";

export function taysendConfigured() {
  return Boolean(process.env.TAYSEND_API_KEY);
}

export async function sendSms(input: { to: string; message: string; reference: string }) {
  const key = process.env.TAYSEND_API_KEY;
  if (!key) return { status: "skipped" as const, id: null, error: "Taysend is not configured" };
  const response = await fetch("https://api.taysend.com/v1/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.reference,
    },
    body: JSON.stringify({
      to: toE164Ghana(input.to),
      sender_id: (process.env.TAYSEND_SENDER_ID || "TECHVERSE").slice(0, 11),
      message: input.message,
      type: "transactional",
      client_reference: input.reference,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string; error?: { message?: string } };
  if (!response.ok) {
    return { status: "failed" as const, id: null, error: body.error?.message || body.message || "SMS failed" };
  }
  return { status: "sent" as const, id: body.id ?? null, error: null };
}
