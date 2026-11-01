import Link from "next/link";
import { BadgeCheck, ShieldCheck, Star, Users } from "lucide-react";
import { STORE } from "@/lib/money";

const points = [
  { icon: BadgeCheck, title: "100% Authentic", text: "Genuine products only" },
  { icon: Users, title: "Trusted by Thousands", text: "Loved by customers worldwide" },
  { icon: Star, title: "Top Rated Store", text: "High-quality gadgets you can trust" },
  { icon: ShieldCheck, title: "Price Match Guarantee", text: "Best prices, always" },
];

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-neutral-200">
      <div className="mx-auto grid w-full max-w-[1920px] gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 min-[900px]:grid-cols-4">
        {points.map((point) => {
          const Icon = point.icon;
          return (
            <div key={point.title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">{point.title}</p>
                <p className="text-xs text-neutral-500">{point.text}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-neutral-100">
        <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-4 px-4 py-6 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-extrabold text-neutral-950">TechVerse</p>
            <p>{STORE.city}, {STORE.country}</p>
            <p>
              <a className="hover:text-brand" href="tel:0256206383">{STORE.phones[0]}</a>
              {" · "}
              <a className="hover:text-brand" href="tel:0553140985">{STORE.phones[1]}</a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Follow us</span>
            {["f", "ig", "yt", "x", "tt"].map((label) => (
              <span key={label} className="grid h-8 w-8 place-items-center rounded-full border border-neutral-200 text-[11px] font-bold uppercase">{label}</span>
            ))}
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[1920px] flex-wrap gap-4 px-4 pb-8 text-xs text-neutral-500 sm:px-6">
          <Link href="/shop" className="hover:text-brand">Shop</Link>
          <Link href="/today" className="hover:text-brand">Today</Link>
          <Link href="/account" className="hover:text-brand">Account</Link>
          <Link href="/orders" className="hover:text-brand">Orders</Link>
          <p className="ml-auto">© {new Date().getFullYear()} TechVerse. Ships from Accra.</p>
        </div>
      </div>
    </footer>
  );
}
