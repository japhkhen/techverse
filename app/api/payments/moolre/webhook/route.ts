import { NextResponse } from "next/server";
import { notifyOrder } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";
import type { PaidNotice } from "@/lib/types";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_moolre_callback", { p_payload: payload });
  if (error) {
    const status = error.message.includes("Invalid callback") ? 401 : 400;
    return NextResponse.json({ error: "Callback rejected" }, { status });
  }
  const notice = data as PaidNotice | null;
  if (notice?.fulfilled) await notifyOrder(notice, "paid");
  return NextResponse.json({ ok: true });
}
