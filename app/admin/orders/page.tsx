import { updateOrderStatus } from "@/app/actions/admin";
import { formatGhs } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Orders</h1>
      <div className="space-y-3">
        {(orders ?? []).map((order) => (
          <form key={order.id} action={updateOrderStatus} className="grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <input type="hidden" name="id" value={order.id} />
            <div>
              <p className="font-extrabold">{order.order_number}</p>
              <p className="text-sm text-neutral-500">{order.full_name} · {order.phone} · {order.city}</p>
              <p className="text-sm font-semibold">{formatGhs(Number(order.total_ghs))} · {order.status}</p>
            </div>
            <select name="status" defaultValue={order.status === "pending" || order.status === "paid" || order.status === "failed" ? "processing" : order.status} className="h-10 rounded-xl border border-neutral-200 px-2 text-sm">
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="h-10 rounded-full bg-brand px-4 text-sm font-bold text-white">Update</button>
          </form>
        ))}
        {(orders ?? []).length === 0 ? <p className="text-neutral-500">No orders yet.</p> : null}
      </div>
    </div>
  );
}
