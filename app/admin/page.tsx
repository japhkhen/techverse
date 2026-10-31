import { setDemoPayments, setExchangeRate } from "@/app/actions/admin";
import { demoPaymentsEnabled, getProducts, getUsdToGhs } from "@/lib/data";
import { formatGhs } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };

export default async function AdminHome() {
  const supabase = await createClient();
  const [products, rate, demo, ordersResult, customersResult] = await Promise.all([
    getProducts(),
    getUsdToGhs(),
    demoPaymentsEnabled(),
    supabase.from("orders").select("id, order_number, status, total_ghs, full_name, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  const orders = ordersResult.data ?? [];
  const revenue = orders.reduce((sum, order) => sum + (["paid", "processing", "shipped", "delivered"].includes(order.status) ? Number(order.total_ghs) : 0), 0);
  const low = products.filter((product) => product.stock <= 5);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Catalog", String(products.length)],
          ["Customers", String(customersResult.count ?? 0)],
          ["Recent revenue", formatGhs(revenue)],
          ["Low stock", String(low.length)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-white p-5">
            <p className="text-xs font-semibold uppercase text-neutral-400">{label}</p>
            <p className="mt-2 text-2xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>
      {demo ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-brand">Demo payments are on. Orders can be completed without a live Moolre charge.</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <form action={setExchangeRate} className="rounded-3xl bg-white p-5">
          <h2 className="font-extrabold">USD to GHS</h2>
          <div className="mt-3 flex gap-2">
            <input name="rate" type="number" step="0.01" defaultValue={rate} className="h-11 flex-1 rounded-xl border border-neutral-200 px-3" />
            <button className="rounded-full bg-neutral-950 px-4 text-sm font-bold text-white">Save</button>
          </div>
        </form>
        <form action={setDemoPayments} className="rounded-3xl bg-white p-5">
          <h2 className="font-extrabold">Demo payments</h2>
          <input type="hidden" name="enabled" value={demo ? "false" : "true"} />
          <button className="mt-3 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white">{demo ? "Turn demo off" : "Turn demo on"}</button>
        </form>
      </div>
      <div className="rounded-3xl bg-white p-5">
        <h2 className="font-extrabold">Latest orders</h2>
        <div className="mt-3 divide-y divide-neutral-100 text-sm">
          {orders.map((order) => (
            <div key={order.id} className="flex justify-between gap-3 py-2">
              <span>{order.order_number} · {order.full_name}</span>
              <span className="font-semibold">{order.status}</span>
            </div>
          ))}
          {orders.length === 0 ? <p className="py-4 text-neutral-500">No orders yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
