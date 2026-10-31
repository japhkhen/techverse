"use client";

import { useActionState } from "react";
import { saveProduct } from "@/app/actions/admin";
import type { Product } from "@/lib/types";

export function ProductForm({
  categories,
  product,
}: {
  categories: { slug: string; name: string }[];
  product?: Product | null;
}) {
  const [state, action, pending] = useActionState(saveProduct, null);
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-neutral-200 bg-white p-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="imageUrl" value={product?.image_url ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required defaultValue={product?.name} placeholder="Name" className="h-11 rounded-xl border border-neutral-200 px-3" />
        <input name="sku" required defaultValue={product?.sku} placeholder="SKU" className="h-11 rounded-xl border border-neutral-200 px-3" />
        <input name="slug" defaultValue={product?.slug} placeholder="Slug" className="h-11 rounded-xl border border-neutral-200 px-3" />
        <select name="category" defaultValue={product?.category?.slug ?? categories[0]?.slug} className="h-11 rounded-xl border border-neutral-200 px-3">
          {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
        </select>
        <input name="price" type="number" step="0.01" required defaultValue={product?.price_usd} placeholder="Price USD" className="h-11 rounded-xl border border-neutral-200 px-3" />
        <input name="compare" type="number" step="0.01" defaultValue={product?.compare_at_usd ?? ""} placeholder="Compare-at USD" className="h-11 rounded-xl border border-neutral-200 px-3" />
        <input name="stock" type="number" required defaultValue={product?.stock ?? 10} placeholder="Stock" className="h-11 rounded-xl border border-neutral-200 px-3" />
        <input name="badge" defaultValue={product?.badge ?? ""} placeholder="Badge" className="h-11 rounded-xl border border-neutral-200 px-3" />
      </div>
      <textarea name="description" required defaultValue={product?.description} placeholder="Description" className="min-h-24 rounded-xl border border-neutral-200 px-3 py-2" />
      <input name="image" type="file" accept="image/*" className="text-sm" />
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <label><input type="checkbox" name="trending" defaultChecked={product?.is_trending} /> Trending</label>
        <label><input type="checkbox" name="deal" defaultChecked={product?.is_deal} /> Deal</label>
        <label><input type="checkbox" name="fresh" defaultChecked={product?.is_new} /> New</label>
      </div>
      {state?.error ? <p className="text-sm font-semibold text-brand">{state.error}</p> : null}
      <button disabled={pending} className="h-11 rounded-full bg-brand text-sm font-bold text-white">{product ? "Save product" : "Add product"}</button>
    </form>
  );
}
