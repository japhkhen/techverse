import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/data";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.user) redirect("/login?next=/admin");
  if (session.profile?.role !== "admin") redirect("/");
  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <div className="mx-auto grid w-full max-w-[1920px] gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-3xl bg-white p-4">
          <Link href="/" className="text-lg font-extrabold">TechVerse</Link>
          <p className="text-xs text-neutral-500">Store admin · Accra</p>
          <nav className="mt-4 space-y-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-neutral-50">{link.label}</Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
