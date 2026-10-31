import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const q = (params.q ?? "").replace(/[%_,.()]/g, "").slice(0, 40);
  let query = supabase.from("profiles").select("id, full_name, email, phone, role, created_at").order("created_at", { ascending: false });
  if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
  const { data: profiles } = await query;
  const { data: orders } = await supabase.from("orders").select("user_id, total_ghs, status");
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Customers</h1>
      <form className="flex gap-2">
        <input name="q" defaultValue={params.q} placeholder="Search name or email" className="h-11 flex-1 rounded-xl border border-neutral-200 bg-white px-3" />
        <button className="rounded-full bg-neutral-950 px-4 text-sm font-bold text-white">Search</button>
      </form>
      <div className="overflow-hidden rounded-3xl bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-neutral-400"><tr><th className="px-4 py-3">Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Role</th></tr></thead>
          <tbody>
            {(profiles ?? []).map((profile) => {
              const mine = (orders ?? []).filter((order) => order.user_id === profile.id);
              const spent = mine.filter((order) => ["paid", "processing", "shipped", "delivered"].includes(order.status)).reduce((sum, order) => sum + Number(order.total_ghs), 0);
              return (
                <tr key={profile.id} className="border-t border-neutral-50">
                  <td className="px-4 py-3 font-semibold">{profile.full_name}</td>
                  <td>{profile.email}</td>
                  <td>{profile.phone}</td>
                  <td>{mine.length} · GHS {spent.toFixed(2)}</td>
                  <td>{profile.role}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
