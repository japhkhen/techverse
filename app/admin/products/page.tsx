import Link from "next/link";
import { deleteProduct } from "@/app/actions/admin";
import { ProductForm } from "@/components/product-form";
import { getProducts } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    getProducts(),
    supabase.from("categories").select("slug, name").order("sort_order"),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Products</h1>
      <ProductForm categories={categories.data ?? []} />
      <div className="overflow-hidden rounded-3xl bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-100 text-xs uppercase text-neutral-400">
            <tr><th className="px-4 py-3">Product</th><th>SKU</th><th>Price</th><th>Stock</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-neutral-50">
                <td className="px-4 py-3 font-semibold">{product.name}</td>
                <td>{product.sku}</td>
                <td>${product.price_usd.toFixed(2)}</td>
                <td className={product.stock <= 5 ? "font-bold text-brand" : ""}>{product.stock}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${product.id}`} className="font-semibold">Edit</Link>
                  <form action={deleteProduct} className="inline">
                    <input type="hidden" name="id" value={product.id} />
                    <button className="ml-3 text-neutral-400">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
