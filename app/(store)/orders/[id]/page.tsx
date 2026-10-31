import Image from "next/image";
import { notFound } from "next/navigation";
import { PaymentPanel } from "@/components/payment-panel";
import { formatGhs, STORE } from "@/lib/money";
import { moolreConfigured } from "@/lib/moolre";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Order" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
  const paid = ["paid", "processing", "shipped", "delivered"].includes(order.status);

  return (
    <div className="mx-auto grid max-w-[980px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="text-sm font-semibold text-brand">{order.order_number}</p>
        <h1 className="text-3xl font-extrabold capitalize">{order.status}</h1>
        <p className="mt-2 text-sm text-neutral-500">{order.full_name} · {order.address_line}, {order.city}, {order.country}</p>
        <div className="mt-6 space-y-3">
          {(items ?? []).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-neutral-50">
                {item.image_url ? <Image src={item.image_url} alt="" fill className="object-contain p-1" /> : null}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-neutral-500">Qty {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-2xl font-extrabold">{formatGhs(Number(order.total_ghs))}</p>
        <p className="mt-2 text-sm text-neutral-500">Help: {STORE.phones[0]} / {STORE.phones[1]}</p>
      </div>
      {paid ? (
        <div className="rounded-[28px] bg-emerald-50 p-6">
          <h2 className="text-xl font-extrabold">Payment received</h2>
          <p className="mt-2 text-sm text-neutral-600">We are preparing this order in Accra. You will get email and SMS updates when Resend and Taysend are connected.</p>
        </div>
      ) : (
        <PaymentPanel
          orderId={order.id}
          amount={formatGhs(Number(order.total_ghs))}
          phone={order.phone}
          demo={process.env.ALLOW_DEMO_PAYMENTS === "true" && !moolreConfigured()}
          live={moolreConfigured()}
        />
      )}
    </div>
  );
}
