"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BadgePercent, Bell, Cable, Cpu, Headphones, Heart, House, LayoutGrid, Menu, Search, ShoppingBag, UserRound, Watch, X } from "lucide-react";
import { useState } from "react";
import { useShop } from "@/components/providers";
import { REGIONS, STORE, type RegionCode } from "@/lib/money";

const nav = [
  { href: "/", label: "Home" },
  { href: "/today", label: "Today" },
  { href: "/following", label: "Following" },
  { href: "/shop", label: "Shop" },
];

const chips = [
  { href: "/shop?category=gadgets", label: "Gadgets", icon: Cpu, key: "gadgets" },
  { href: "/shop?category=smart-home", label: "Smart Home", icon: House, key: "smart-home" },
  { href: "/shop?category=audio", label: "Audio", icon: Headphones, key: "audio" },
  { href: "/shop?category=wearables", label: "Wearables", icon: Watch, key: "wearables" },
  { href: "/shop?category=accessories", label: "Accessories", icon: Cable, key: "accessories" },
  { href: "/shop?category=sale", label: "Sale", icon: BadgePercent, key: "sale" },
];

export function SiteHeader({ signedIn, admin }: { signedIn: boolean; admin: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const category = params.get("category");
  const { count, region, setRegion } = useShop();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(params.get("q") ?? "");

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="bg-neutral-950 text-white">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-3 px-4 py-1.5 text-[11px] sm:px-6">
          <p>
            {STORE.city}, {STORE.country}
          </p>
          <p className="truncate">
            <a href="tel:0256206383" className="hover:underline">{STORE.phones[0]}</a>
            <span className="mx-2 text-white/40">/</span>
            <a href="tel:0553140985" className="hover:underline">{STORE.phones[1]}</a>
          </p>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[1920px] items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
            <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
              <path d="M8.5 9.5h4.1l3.4 8.4 3.4-8.4h4.1L16.8 23h-3.6L8.5 9.5z" fill="currentColor" />
            </svg>
          </span>
          <span className="hidden min-[760px]:block">
            <span className="block text-[17px] font-extrabold leading-none tracking-tight">TechVerse</span>
            <span className="mt-1 hidden text-[11px] text-neutral-500 xl:block">{STORE.tagline}</span>
          </span>
        </Link>
        <form action="/shop" className="relative min-w-0 flex-1">
          <input
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for tech gadgets, ideas and more"
            className="h-11 w-full rounded-full border border-neutral-200 bg-white pl-4 pr-12 text-sm outline-none ring-brand/30 placeholder:text-neutral-400 focus:ring-2"
          />
          <button type="submit" aria-label="Search" className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full bg-neutral-950 text-white">
            <Search className="h-4 w-4" />
          </button>
        </form>
        <nav className="hidden shrink-0 items-center gap-3 min-[760px]:flex xl:gap-5">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`text-sm font-semibold ${active ? "text-brand underline decoration-2 underline-offset-8" : "text-neutral-900"}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden shrink-0 items-center gap-2.5 text-neutral-800 min-[760px]:flex xl:gap-3">
          <Link href="/shop" aria-label="Browse categories"><LayoutGrid className="h-5 w-5" /></Link>
          <Link href={signedIn ? "/account" : "/login"} aria-label="Account"><UserRound className="h-5 w-5" /></Link>
          <Link href={signedIn ? "/orders" : "/login?next=/orders"} aria-label="Orders"><Bell className="h-5 w-5" /></Link>
          <Link href="/cart" aria-label="Cart" className="relative">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 ? <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{count}</span> : null}
          </Link>
        </div>
        <Link href="/cart" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-neutral-200 min-[760px]:hidden" aria-label="Cart">
          <ShoppingBag className="h-4 w-4" />
          {count > 0 ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{count}</span> : null}
        </Link>
        <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-neutral-200 min-[760px]:hidden" onClick={() => setOpen((value) => !value)} aria-label="Menu">
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open ? (
        <div className="space-y-2 border-t border-neutral-100 px-4 py-3 min-[760px]:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-neutral-50">
              {item.label}
            </Link>
          ))}
          <Link href={signedIn ? "/account" : "/login"} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-neutral-50">Account</Link>
          {admin ? <Link href="/admin" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-semibold text-brand">Admin</Link> : null}
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-[1920px] items-center gap-3 px-4 pb-3 sm:px-6">
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto min-[760px]:flex-wrap min-[760px]:overflow-visible">
          {chips.map((chip) => {
            const Icon = chip.icon;
            const active = category === chip.key;
            return (
              <Link key={chip.key} href={chip.href} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${active ? "border-brand bg-red-50 text-brand" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}>
                <Icon className="h-3.5 w-3.5" />
                {chip.label}
              </Link>
            );
          })}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex items-center rounded-full border border-neutral-200 p-0.5 text-xs font-bold">
            {(Object.keys(REGIONS) as RegionCode[]).map((code) => (
              <button key={code} type="button" onClick={() => setRegion(code)} className={`rounded-full px-2 py-1 ${region === code ? "bg-neutral-950 text-white" : "text-neutral-500"}`}>
                {REGIONS[code].label}
              </button>
            ))}
          </div>
          <Link href="/following" aria-label="Saved gadgets" className="text-neutral-700"><Heart className="h-5 w-5" /></Link>
        </div>
      </div>
    </header>
  );
}
