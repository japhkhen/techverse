"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/components/providers";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const { addItem, region } = useShop();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock < 1;

  return (
    <div>
      <p className="text-2xl font-extrabold">{formatMoney(product.price_usd, region)}</p>
      {product.compare_at_usd ? (
        <p className="text-sm text-neutral-400 line-through">{formatMoney(product.compare_at_usd, region)}</p>
      ) : null}
      <p className={`mt-2 text-sm font-semibold ${product.stock <= 5 ? "text-brand" : "text-emerald-700"}`}>
        {soldOut ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left in Accra` : `${product.stock} in stock`}
      </p>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex items-center rounded-full border border-neutral-200">
          <button type="button" className="h-10 w-10" onClick={() => setQty((value) => Math.max(1, value - 1))}>-</button>
          <span className="w-6 text-center text-sm font-bold">{qty}</span>
          <button type="button" className="h-10 w-10" onClick={() => setQty((value) => Math.min(product.stock, value + 1))}>+</button>
        </div>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            addItem({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceUsd: product.price_usd,
              image: product.image_url,
              quantity: qty,
              stock: product.stock,
            });
            setAdded(true);
          }}
          className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {added ? "Added" : "Add to cart"}
        </button>
      </div>
      {added ? (
        <button type="button" onClick={() => router.push("/cart")} className="mt-3 text-sm font-semibold text-brand">
          View cart
        </button>
      ) : null}
    </div>
  );
}
