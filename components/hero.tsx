"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { useShop } from "@/components/providers";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

const slides = [
  {
    kicker: "Discover. Shop. Upgrade.",
    title: "Latest Tech",
    accent: "Gadgets",
    text: "Explore cutting-edge gadgets that upgrade your lifestyle.",
    label: "Trending now",
    pick: (product: Product) => product.is_trending,
  },
  {
    kicker: "Just landed in Accra",
    title: "New",
    accent: "Arrivals",
    text: "Watches, audio, and smart home gear ready to ship from Accra.",
    label: "New arrivals",
    pick: (product: Product) => product.is_new,
  },
  {
    kicker: "This week only",
    title: "Deals on",
    accent: "Audio",
    text: "Save on speakers, chargers, headphones, and desk setups.",
    label: "On sale",
    pick: (product: Product) => product.is_deal,
  },
];

function takeProducts(products: Product[], prefer: (product: Product) => boolean, count = 6) {
  const preferred = products.filter(prefer);
  const picked = [...preferred];
  for (const product of products) {
    if (picked.length >= count) break;
    if (!picked.some((item) => item.id === product.id)) picked.push(product);
  }
  return picked.slice(0, count);
}

export function Hero({ products }: { products: Product[] }) {
  const { region } = useShop();
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const shown = useMemo(() => takeProducts(products, slide.pick), [products, slide]);

  return (
    <section className="mx-auto max-w-[1180px] px-4 pt-5 sm:px-6">
      <div className="grid overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.05)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-12">
          <p className="text-sm font-semibold text-neutral-500">{slide.kicker}</p>
          <h1 className="mt-3 max-w-md text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
            {slide.title}
            <span className="block text-brand">{slide.accent}</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-600">{slide.text}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white">
              Shop Now <span aria-hidden>→</span>
            </Link>
            <Link href="/shop?category=gadgets" className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-bold">
              Browse Collection
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-3 text-xs font-semibold text-neutral-600">
            <span>🇬🇭</span><span>🇺🇸</span><span>🇬🇧</span><span>🇦🇪</span>
            <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Fast Shipping</span>
          </div>
        </div>
        <div className="flex flex-col bg-brand p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-white">{slide.label}</p>
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-center shadow-lg">
              <div>
                <p className="text-[11px] font-extrabold leading-tight">New<br />Arrivals</p>
                <span className="mx-auto mt-1 block h-0.5 w-4 bg-neutral-950" />
              </div>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3">
            {shown.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="flex min-w-0 items-center gap-3 rounded-2xl bg-white p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
              >
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-[72px] sm:w-[72px]">
                  <Image src={product.image_url} alt="" fill sizes="72px" className="object-contain p-1.5" />
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-[13px] font-bold leading-snug text-neutral-950">{product.name}</span>
                  <span className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-extrabold text-brand">{formatMoney(product.price_usd, region)}</span>
                    {product.compare_at_usd ? (
                      <span className="text-[11px] font-semibold text-neutral-400 line-through">{formatMoney(product.compare_at_usd, region)}</span>
                    ) : null}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button type="button" aria-label="Previous slide" onClick={() => setIndex((index + slides.length - 1) % slides.length)} className="grid h-8 w-8 place-items-center rounded-full bg-white/90"><ChevronLeft className="h-4 w-4" /></button>
            <div className="flex gap-1">
              {slides.map((item, dot) => (
                <button key={item.title} type="button" aria-label={`Slide ${dot + 1}`} onClick={() => setIndex(dot)} className={`h-1.5 rounded-full ${dot === index ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />
              ))}
            </div>
            <button type="button" aria-label="Next slide" onClick={() => setIndex((index + 1) % slides.length)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-brand"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
