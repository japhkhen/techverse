import { CartView } from "@/components/cart-view";
import { getUsdToGhs } from "@/lib/data";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const rate = await getUsdToGhs();
  return (
    <div className="mx-auto w-full max-w-[1920px] px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Cart</h1>
      <CartView rate={rate} />
    </div>
  );
}
