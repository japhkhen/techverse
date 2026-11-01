import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift, Headphones, House, RotateCcw, ShieldCheck, Truck, Watch } from "lucide-react";
import { Hero } from "@/components/hero";
import { NewsletterForm } from "@/components/newsletter-form";
import { ProductCard } from "@/components/product-card";
import { getIdeas, getProducts, getSession } from "@/lib/data";
import { STORE } from "@/lib/money";

const categories = [
  { href: "/shop?category=audio", title: "Audio", text: "Premium Sound", icon: Headphones },
  { href: "/shop?category=smart-home", title: "Smart Devices", text: "Smarter Living", icon: House },
  { href: "/shop?category=wearables", title: "Wearables", text: "Track. Achieve.", icon: Watch },
  { href: "/shop?category=accessories", title: "Accessories", text: "Designed for You", icon: Headphones },
  { href: "/shop?category=sale", title: "Deals", text: "Top Deals Today", icon: Gift },
];

const trust = [
  { icon: Truck, title: "Worldwide Shipping", text: "Fast delivery across Ghana, the US, UK, and UAE" },
  { icon: ShieldCheck, title: "Secure Payments", text: "Mobile money and card checkout with Moolre" },
  { icon: RotateCcw, title: "30-Day Returns", text: "Hassle-free returns guaranteed" },
  { icon: Headphones, title: "Premium Support", text: "Call 02562063.83 or 0553140985" },
];

export default async function HomePage() {
  const [products, ideas, session] = await Promise.all([getProducts(), getIdeas(), getSession()]);
  const trending = products.filter((product) => product.is_trending).slice(0, 6);

  return (
    <>
      <Hero products={products} />
      <section className="mx-auto grid w-full max-w-[1920px] gap-3 px-4 py-6 sm:grid-cols-2 sm:px-6 min-[900px]:grid-cols-3 xl:grid-cols-5">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Link key={category.title} href={category.href} className="flex items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3 hover:border-neutral-300">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-neutral-50"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{category.title}</span>
                <span className="block text-xs text-neutral-500">{category.text}</span>
              </span>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-white"><ArrowRight className="h-3.5 w-3.5" /></span>
            </Link>
          );
        })}
      </section>
      <section className="mx-auto w-full max-w-[1920px] px-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">Trending Products</h2>
          <Link href="/shop" className="text-sm font-semibold text-neutral-500">View all</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 min-[760px]:grid-cols-3 xl:grid-cols-6">
          {trending.map((product) => <ProductCard key={product.id} product={product} signedIn={Boolean(session.user)} />)}
        </div>
      </section>
      <section className="mx-auto mt-8 grid w-full max-w-[1920px] gap-4 px-4 sm:grid-cols-2 sm:px-6 min-[900px]:grid-cols-4">
        {trust.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-neutral-100 px-2 py-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-50 text-brand"><Icon className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="text-xs leading-5 text-neutral-500">{item.text}</p>
              </div>
            </div>
          );
        })}
      </section>
      <section id="ideas" className="mx-auto mt-10 w-full max-w-[1920px] px-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">Ideas for Your Next Upgrade</h2>
          <Link href="/ideas" className="text-sm font-semibold text-neutral-500">See more ideas</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {ideas.map((idea) => (
            <Link key={idea.id} href={`/ideas/${idea.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl">
              <Image src={idea.image_url} alt={idea.title} fill className="object-cover transition duration-300 group-hover:scale-105" sizes="240px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-sm font-bold leading-tight">{idea.title}</p>
                <p className="text-xs text-white/80">{idea.idea_count} ideas</p>
              </div>
              <span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white text-neutral-950"><ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto mt-10 grid w-full max-w-[1920px] gap-4 px-4 sm:px-6 min-[900px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-[28px] bg-brand p-8 text-white">
          <Gift className="h-8 w-8" />
          <h2 className="mt-4 text-3xl font-extrabold leading-tight">Exclusive Deals for You!</h2>
          <p className="mt-2 max-w-xs text-sm text-white/85">Save more on top-rated gadgets handpicked just for you.</p>
          <Link href="/shop?category=sale" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-neutral-950">
            Shop Deals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="relative overflow-hidden rounded-[28px] border border-neutral-200 p-8">
          <h2 className="text-2xl font-extrabold">Get the Latest Tech & Deals</h2>
          <p className="mt-1 text-sm text-neutral-500">Join our newsletter and never miss an update from {STORE.city}.</p>
          <NewsletterForm />
          <div className="pointer-events-none absolute -bottom-6 right-4 hidden h-36 w-40 rounded-t-[40px] bg-red-50 sm:block" />
          <div className="pointer-events-none absolute bottom-6 right-10 hidden h-16 w-24 rotate-6 rounded-xl border border-red-200 bg-white sm:block" />
        </div>
      </section>
    </>
  );
}
