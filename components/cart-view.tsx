"use client";

import Image from "next/image";
import Link from "next/link";
import { useShop } from "@/components/providers";
import { formatGhs, formatMoney, shippingUsd, USD_TO_GHS } from "@/lib/money";

export function CartView({ rate }: { rate: number }) {
  const { items, updateQty, removeItem, subtotal, region } = useShop();
  const shipping = shippingUsd(subtotal, "Ghana");
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-3xl font-extrabold">Your cart is empty</h1>
        <Link href="/shop" className="mt-5 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-bold text-white">Browse gadgets</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-4 rounded-2xl border border-neutral-200 p-3">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-50">
              <Image src={item.image} alt="" fill className="object-contain p-2" />
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${item.slug}`} className="font-bold">{item.name}</Link>
              <p className="text-sm text-neutral-500">{formatMoney(item.priceUsd, region)}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-neutral-200">
                  <button type="button" className="h-8 w-8" onClick={() => updateQty(item.productId, item.quantity - 1)}>-</button>
                  <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                  <button type="button" className="h-8 w-8" onClick={() => updateQty(item.productId, item.quantity + 1)}>+</button>
                </div>
                <button type="button" onClick={() => removeItem(item.productId)} className="text-xs font-semibold text-neutral-500">Remove</button>
              </div>
            </div>
            <p className="text-sm font-bold">{formatMoney(item.priceUsd * item.quantity, region)}</p>
          </div>
        ))}
      </div>
      <aside className="h-fit rounded-[28px] border border-neutral-200 p-6">
        <h2 className="text-lg font-extrabold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(subtotal, region)}</dd></div>
          <div className="flex justify-between"><dt>Ghana delivery</dt><dd>{shipping === 0 ? "Free" : formatMoney(shipping, region)}</dd></div>
          <div className="flex justify-between border-t border-neutral-100 pt-3 text-base font-extrabold"><dt>Estimated total</dt><dd>{formatGhs(total * rate)}</dd></div>
        </dl>
        <p className="mt-2 text-xs text-neutral-500">Charged in Ghana cedis via Moolre. 1 USD = {rate.toFixed(2)} GHS. Free Ghana delivery from ${75}. Display rate on the site is {USD_TO_GHS} unless an admin updates it.</p>
        <Link href="/checkout" className="mt-5 block rounded-full bg-brand py-3 text-center text-sm font-bold text-white">Checkout</Link>
      </aside>
    </div>
  );
}
