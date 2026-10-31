import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getProducts, getSession } from "@/lib/data";

const filters = [
  { href: "/shop", label: "All", key: "" },
  { href: "/shop?category=gadgets", label: "Gadgets", key: "gadgets" },
  { href: "/shop?category=smart-home", label: "Smart Home", key: "smart-home" },
  { href: "/shop?category=audio", label: "Audio", key: "audio" },
  { href: "/shop?category=wearables", label: "Wearables", key: "wearables" },
  { href: "/shop?category=accessories", label: "Accessories", key: "accessories" },
  { href: "/shop?category=sale", label: "Sale", key: "sale" },
];

export const metadata = { title: "Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const [catalog, session] = await Promise.all([getProducts(), getSession()]);
  let products = catalog;
  if (params.category === "sale") products = products.filter((product) => product.is_deal || product.compare_at_usd);
  else if (params.category) products = products.filter((product) => product.category?.slug === params.category);
  if (params.q) {
    const query = params.q.toLowerCase();
    products = products.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(query));
  }
  if (params.sort === "price-asc") products = [...products].sort((a, b) => a.price_usd - b.price_usd);
  if (params.sort === "price-desc") products = [...products].sort((a, b) => b.price_usd - a.price_usd);
  if (params.sort === "popular") products = [...products].sort((a, b) => b.likes - a.likes);

  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  const base = `/shop${query.toString() ? `?${query}` : ""}`;
  const sortHref = (sort: string) => {
    const next = new URLSearchParams(query);
    if (sort) next.set("sort", sort);
    const text = next.toString();
    return `/shop${text ? `?${text}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{params.q ? `Results for “${params.q}”` : "Shop gadgets"}</h1>
          <p className="mt-1 text-sm text-neutral-500">{products.length} products from our Accra store</p>
        </div>
        <div className="flex gap-2 text-xs font-semibold">
          <Link href={sortHref("")} className="rounded-full border border-neutral-200 px-3 py-1.5">Featured</Link>
          <Link href={sortHref("popular")} className="rounded-full border border-neutral-200 px-3 py-1.5">Popular</Link>
          <Link href={sortHref("price-asc")} className="rounded-full border border-neutral-200 px-3 py-1.5">Price</Link>
          <Link href={sortHref("price-desc")} className="rounded-full border border-neutral-200 px-3 py-1.5">Price ↓</Link>
        </div>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {filters.map((filter) => (
          <Link key={filter.label} href={params.q ? `${filter.href}${filter.href.includes("?") ? "&" : "?"}q=${encodeURIComponent(params.q)}` : filter.href} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${(params.category ?? "") === filter.key ? "bg-neutral-950 text-white" : "bg-neutral-100"}`}>
            {filter.label}
          </Link>
        ))}
      </div>
      {products.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">Nothing matched that search. <Link href={base} className="font-semibold text-brand">Clear filters</Link></p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} signedIn={Boolean(session.user)} />)}
        </div>
      )}
    </div>
  );
}
