import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { getSession, getUsdToGhs } from "@/lib/data";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session.user) redirect("/login?next=/checkout");
  const rate = await getUsdToGhs();
  return (
    <div className="mx-auto w-full max-w-[1920px] px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Checkout</h1>
      <CheckoutForm rate={rate} profile={session.profile} />
    </div>
  );
}
