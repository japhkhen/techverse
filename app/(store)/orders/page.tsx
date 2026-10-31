import Link from "next/link";
import { formatGhs } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold">Your orders</h1>
      <div className="mt-6 space-y-3">
        {(orders ?? []).map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`} className="block rounded-2xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-extrabold">{order.order_number}</p>
              <p className="text-sm font-semibold capitalize">{order.status}</p>
            </div>
            <p className="mt-1 text-sm text-neutral-500">{formatGhs(Number(order.total_ghs))} · {order.city}</p>
          </Link>
        ))}
        {(orders ?? []).length === 0 ? <p className="text-sm text-neutral-500">You have not placed an order yet.</p> : null}
      </div>
    </div>
  );
}
