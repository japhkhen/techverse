import { notFound } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { getProducts } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    getProducts(),
    supabase.from("categories").select("slug, name").order("sort_order"),
  ]);
  const product = products.find((item) => item.id === id);
  if (!product) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Edit {product.name}</h1>
      <ProductForm categories={categories.data ?? []} product={product} />
    </div>
  );
}
