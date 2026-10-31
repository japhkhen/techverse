import { orderEmail, sendEmail } from "@/lib/email";
import { formatGhs, STORE } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/taysend";
import type { PaidNotice } from "@/lib/types";

async function logNotice(input: {
  orderId?: string;
  channel: string;
  event: string;
  recipient: string;
  status: string;
  providerId?: string | null;
  error?: string | null;
}) {
  if (!input.orderId || !process.env.APP_ACTION_SECRET) return;
  const supabase = await createClient();
  await supabase.rpc("record_notification", {
    p_secret: process.env.APP_ACTION_SECRET,
    p_order_id: input.orderId,
    p_channel: input.channel,
    p_event: input.event,
    p_recipient: input.recipient,
    p_status: input.status,
    p_provider_id: input.providerId ?? null,
    p_error: input.error ?? null,
  });
}

export async function notifyOrder(notice: PaidNotice, event: "paid" | "shipped" | "delivered") {
  if (!notice.order_id) return { email: "skipped", sms: "skipped" };
  const headlines = {
    paid: "Your TechVerse order is confirmed",
    shipped: "Your TechVerse order is on the way",
    delivered: "Your TechVerse order was delivered",
  };
  const smsLines = {
    paid: `TechVerse: ${notice.order_number} is confirmed. Total ${formatGhs(Number(notice.total_ghs || 0))}. We ship from Accra. Help ${STORE.phones[1]}`,
    shipped: `TechVerse: ${notice.order_number} is on the way from Accra. Help ${STORE.phones[1]}`,
    delivered: `TechVerse: ${notice.order_number} was delivered. Thank you for shopping with us.`,
  };

  let emailStatus = "skipped";
  if (notice.email) {
    const email = await sendEmail({
      to: notice.email,
      subject: headlines[event],
      html: orderEmail(notice, headlines[event]),
    });
    emailStatus = email.status;
    await logNotice({
      orderId: notice.order_id,
      channel: "email",
      event,
      recipient: notice.email,
      status: email.status,
      providerId: email.id,
      error: email.error,
    });
  }

  let smsStatus = "skipped";
  if (notice.phone) {
    const sms = await sendSms({
      to: notice.phone,
      message: smsLines[event],
      reference: `${notice.order_id}-${event}`,
    });
    smsStatus = sms.status;
    await logNotice({
      orderId: notice.order_id,
      channel: "sms",
      event,
      recipient: notice.phone,
      status: sms.status,
      providerId: sms.id,
      error: sms.error,
    });
  }

  return { email: emailStatus, sms: smsStatus };
}
