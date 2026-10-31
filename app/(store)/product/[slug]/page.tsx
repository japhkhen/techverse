import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductCard } from "@/components/product-card";
import { getProduct, getProducts, getSession } from "@/lib/data";
import { STORE } from "@/lib/money";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, products, session] = await Promise.all([getProduct(slug), getProducts(), getSession()]);
  if (!product) notFound();
  const related = products.filter((item) => item.category?.slug === product.category?.slug && item.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold text-neutral-500">
        <Link href="/shop">Shop</Link>
        {product.category ? <> / <Link href={`/shop?category=${product.category.slug}`}>{product.category.name}</Link></> : null}
      </p>
      <div className="mt-4 grid items-start gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-[28px] bg-[#f6f6f6]">
          <Image src={product.image_url} alt={product.name} fill className="object-contain p-10" priority />
        </div>
        <div>
          {product.badge ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-brand">{product.badge}</span> : null}
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{product.name}</h1>
          <p className="mt-2 text-sm text-neutral-500">Rated {Number(product.rating).toFixed(1)} · SKU {product.sku}</p>
          <div className="mt-6"><AddToCart product={product} /></div>
          <p className="mt-6 max-w-xl text-sm leading-7 text-neutral-600">{product.description}</p>
          <div className="mt-6 rounded-2xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
            Ships from {STORE.city}, {STORE.country}. Delivery across Ghana, the US, the UK, and the UAE.
            Questions? Call {STORE.phones[0]} or {STORE.phones[1]}.
          </div>
        </div>
      </div>
      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold">Related gadgets</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((item) => <ProductCard key={item.id} product={item} signedIn={Boolean(session.user)} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
