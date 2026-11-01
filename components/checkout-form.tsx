"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { placeOrder } from "@/app/actions/store";
import { useShop } from "@/components/providers";
import { formatGhs, shippingUsd } from "@/lib/money";
import type { Profile } from "@/lib/types";

const countries = ["Ghana", "United States", "United Kingdom", "United Arab Emirates"] as const;

export function CheckoutForm({ rate, profile }: { rate: number; profile: Profile | null }) {
  const { items, subtotal, clearCart } = useShop();
  const router = useRouter();
  const [country, setCountry] = useState<(typeof countries)[number]>("Ghana");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const shipping = shippingUsd(subtotal, country);
  const totalGhs = (subtotal + shipping) * rate;

  if (items.length === 0) {
    return <p className="text-neutral-500">Your cart is empty. Add a gadget before checkout.</p>;
  }

  return (
    <form
      className="grid gap-8 min-[900px]:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const form = new FormData(event.currentTarget);
        const result = await placeOrder({
          fullName: String(form.get("fullName") || ""),
          phone: String(form.get("phone") || ""),
          address: String(form.get("address") || ""),
          city: String(form.get("city") || ""),
          regionName: String(form.get("regionName") || ""),
          country,
          notes: String(form.get("notes") || ""),
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        });
        setPending(false);
        if (result.error || !result.order) {
          setError(result.error || "Could not place the order.");
          return;
        }
        clearCart();
        router.push(`/orders/${result.order.order_id}`);
      }}
    >
      <div className="space-y-4">
        <label className="block text-sm font-semibold">Full name
          <input name="fullName" defaultValue={profile?.full_name ?? ""} required className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold">Phone
          <input name="phone" defaultValue={profile?.phone ?? ""} required className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold">Address
          <input name="address" required placeholder="Street and area" className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 font-normal" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">City
            <input name="city" defaultValue="Accra" required className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 font-normal" />
          </label>
          <label className="block text-sm font-semibold">Region
            <input name="regionName" defaultValue="Greater Accra" required className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 font-normal" />
          </label>
        </div>
        <label className="block text-sm font-semibold">Country
          <select value={country} onChange={(event) => setCountry(event.target.value as (typeof countries)[number])} className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 font-normal">
            {countries.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">Notes
          <textarea name="notes" className="mt-1 min-h-24 w-full rounded-xl border border-neutral-200 px-3 py-2 font-normal" />
        </label>
      </div>
      <aside className="h-fit rounded-[28px] border border-neutral-200 p-6">
        <h2 className="font-extrabold">Pay with Moolre</h2>
        <ul className="mt-3 space-y-1 text-sm text-neutral-600">
          {items.map((item) => <li key={item.productId} className="flex justify-between gap-3"><span>{item.name} × {item.quantity}</span></li>)}
        </ul>
        <p className="mt-4 text-2xl font-extrabold">{formatGhs(totalGhs)}</p>
        <p className="mt-1 text-xs leading-5 text-neutral-500">Payments are collected in Ghana cedis. Mobile money uses MTN, Telecel, or AT. International orders still pay through Moolre.</p>
        {error ? <p className="mt-3 text-sm font-semibold text-brand">{error}</p> : null}
        <button disabled={pending} className="mt-5 w-full rounded-full bg-brand py-3 text-sm font-bold text-white disabled:opacity-60">
          {pending ? "Placing order..." : "Place order"}
        </button>
      </aside>
    </form>
  );
}
