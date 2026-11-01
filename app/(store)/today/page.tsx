import { ProductCard } from "@/components/product-card";
import { getProducts, getSession } from "@/lib/data";

export const metadata = { title: "Today" };

export default async function TodayPage() {
  const [products, session] = await Promise.all([getProducts(), getSession()]);
  const deals = products.filter((product) => product.is_deal);
  const fresh = products.filter((product) => product.is_new);
  return (
    <div className="mx-auto w-full max-w-[1920px] px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold text-brand">Today in Accra</p>
      <h1 className="mt-1 text-4xl font-extrabold tracking-tight">Deals and new arrivals</h1>
      <section className="mt-8">
        <h2 className="text-2xl font-extrabold">Top deals</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {deals.map((product) => <ProductCard key={product.id} product={product} signedIn={Boolean(session.user)} />)}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-extrabold">New arrivals</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {fresh.map((product) => <ProductCard key={product.id} product={product} signedIn={Boolean(session.user)} />)}
        </div>
      </section>
    </div>
  );
}
