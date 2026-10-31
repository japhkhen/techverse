import { updateStock } from "@/app/actions/admin";
import { getProducts } from "@/lib/data";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const products = await getProducts();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Inventory</h1>
      <p className="text-sm text-neutral-500">Stock is held in Accra and reduced when Moolre confirms payment.</p>
      <div className="space-y-3">
        {products.map((product) => (
          <form key={product.id} action={updateStock} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
            <input type="hidden" name="id" value={product.id} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{product.name}</p>
              <p className="text-xs text-neutral-500">{product.sku}</p>
            </div>
            <input name="stock" type="number" min={0} defaultValue={product.stock} className={`h-10 w-24 rounded-xl border px-3 ${product.stock <= 5 ? "border-brand" : "border-neutral-200"}`} />
            <button className="rounded-full bg-neutral-950 px-4 py-2 text-xs font-bold text-white">Update</button>
          </form>
        ))}
      </div>
    </div>
  );
}
