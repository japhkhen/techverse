"use server";

import { revalidatePath } from "next/cache";
import {
  checkPaymentStatus,
  collectMobileMoney,
  createPaymentLink,
  moolreConfigured,
  paymentMessage,
  readTransactionId,
  readTxStatus,
} from "@/lib/moolre";
import { notifyOrder } from "@/lib/notify";
import { isGhanaMobile, toMoolreLocal } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import type { PaidNotice } from "@/lib/types";

async function ownedPayment(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." as const };
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, email, order_number, total_ghs, total_usd, full_name, phone")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: "Order not found." as const };
  const { data: payment } = await supabase.from("payments").select("*").eq("order_id", orderId).maybeSingle();
  if (!order || !payment) return { error: "Payment not found." as const };
  return { supabase, order, payment };
}

export async function startMobileMoney(input: {
  orderId: string;
  channel: "13" | "6" | "7";
  phone: string;
  otp?: string;
}) {
  if (!moolreConfigured()) return { error: "Moolre is not configured yet. Use demo payment to preview checkout." };
  if (!isGhanaMobile(input.phone)) return { error: "Enter a Ghana mobile money number, for example 0553140985." };
  const loaded = await ownedPayment(input.orderId);
  if ("error" in loaded) return { error: loaded.error };
  const { supabase, payment } = loaded;
  if (payment.status === "paid") return { status: "paid" as const };

  const result = await collectMobileMoney({
    channel: input.channel,
    payer: toMoolreLocal(input.phone),
    amount: Number(payment.amount_ghs).toFixed(2),
    externalRef: payment.external_ref,
    otp: input.otp,
  });
  const status = result.code === "TP14" ? "otp_required" : result.code === "TR099" || Number(result.status) === 1 ? "prompt_sent" : "failed";
  await supabase.rpc("attach_payment_attempt", {
    p_order_id: input.orderId,
    p_channel: input.channel,
    p_payer: toMoolreLocal(input.phone),
    p_status: status === "failed" ? "failed" : status,
    p_authorization_url: null,
    p_raw: result,
  });
  if (status === "failed") return { error: paymentMessage(result) };
  return { status, message: paymentMessage(result), code: result.code };
}

export async function startPaymentLink(orderId: string) {
  if (!moolreConfigured()) return { error: "Add Moolre keys to open the hosted checkout." };
  const loaded = await ownedPayment(orderId);
  if ("error" in loaded) return { error: loaded.error };
  const { supabase, order, payment } = loaded;
  const site = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const result = await createPaymentLink({
    amount: Number(payment.amount_ghs).toFixed(2),
    email: order.email,
    externalRef: payment.external_ref,
    callbackUrl: `${site}/api/payments/moolre/webhook`,
    redirectUrl: `${site}/orders/${orderId}`,
  });
  const url = result.authorization_url;
  if (!url) return { error: paymentMessage(result) };
  await supabase.rpc("attach_payment_attempt", {
    p_order_id: orderId,
    p_channel: "link",
    p_payer: null,
    p_status: "prompt_sent",
    p_authorization_url: url,
    p_raw: result,
  });
  return { url };
}

export async function refreshPayment(orderId: string) {
  const loaded = await ownedPayment(orderId);
  if ("error" in loaded) return { error: loaded.error };
  const { supabase, payment } = loaded;
  if (payment.status === "paid") return { status: "paid" as const };
  if (!moolreConfigured()) return { status: payment.status as string, demo: true };

  const result = await checkPaymentStatus(payment.external_ref);
  const tx = readTxStatus(result);
  if (tx === 1) {
    const { data, error } = await supabase.rpc("finalize_payment", {
      p_external_ref: payment.external_ref,
      p_transaction_id: readTransactionId(result),
      p_action_secret: process.env.APP_ACTION_SECRET,
    });
    if (error) return { error: error.message };
    const notice = data as PaidNotice;
    let delivery = null;
    if (notice?.fulfilled) delivery = await notifyOrder(notice, "paid");
    revalidatePath(`/orders/${orderId}`);
    return { status: "paid" as const, delivery };
  }
  if (tx === 2) {
    await supabase.rpc("attach_payment_attempt", {
      p_order_id: orderId,
      p_channel: payment.channel,
      p_payer: payment.payer,
      p_status: "failed",
      p_authorization_url: payment.authorization_url,
      p_raw: result,
    });
    return { status: "failed" as const, message: paymentMessage(result) };
  }
  return { status: (payment.status as string) || "pending", message: "Waiting for approval on your phone." };
}

export async function completeDemoPayment(orderId: string) {
  if (process.env.ALLOW_DEMO_PAYMENTS !== "true") return { error: "Demo payments are turned off." };
  if (moolreConfigured()) return { error: "Moolre is live. Approve the prompt on your phone." };
  const loaded = await ownedPayment(orderId);
  if ("error" in loaded) return { error: loaded.error };
  const { supabase } = loaded;
  const { data, error } = await supabase.rpc("demo_complete_payment", { p_order_id: orderId });
  if (error) return { error: error.message };
  const notice = data as PaidNotice;
  let delivery = null;
  if (notice?.fulfilled) delivery = await notifyOrder(notice, "paid");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin");
  return { status: "paid" as const, delivery };
}
