import { formatGhs, STORE } from "@/lib/money";
import type { PaidNotice } from "@/lib/types";

function money(usd: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usd);
}

export async function sendEmail(input: { to: string; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: "skipped" as const, id: null, error: "Resend is not configured" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "TechVerse <onboarding@resend.dev>",
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!response.ok) {
    return { status: "failed" as const, id: null, error: body.message || "Email failed" };
  }
  return { status: "sent" as const, id: body.id ?? null, error: null };
}

export function orderEmail(notice: PaidNotice, headline: string) {
  const items = (notice.items ?? [])
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${item.name} × ${item.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${money(Number(item.unit_price_usd) * item.quantity)}</td></tr>`,
    )
    .join("");
  return `
    <div style="font-family:Arial,sans-serif;color:#111;max-width:560px;margin:0 auto">
      <div style="background:#E60023;color:#fff;padding:20px 24px;border-radius:16px 16px 0 0">
        <strong style="font-size:20px">${STORE.name}</strong>
        <div style="opacity:.9;font-size:13px">${STORE.tagline}</div>
      </div>
      <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 16px 16px">
        <h1 style="font-size:22px;margin:0 0 8px">${headline}</h1>
        <p style="margin:0 0 16px">Hi ${notice.full_name || "there"}, order <strong>${notice.order_number}</strong> is updated.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${items}</table>
        <p style="font-size:16px"><strong>Total charged:</strong> ${formatGhs(Number(notice.total_ghs || 0))}</p>
        <p style="color:#555;font-size:13px">TechVerse ships from ${STORE.city}, ${STORE.country}. Questions? Call ${STORE.phones[0]} or ${STORE.phones[1]}.</p>
      </div>
    </div>
  `;
}
