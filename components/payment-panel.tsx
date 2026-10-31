"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeDemoPayment, refreshPayment, startMobileMoney, startPaymentLink } from "@/app/actions/payments";

const networks = [
  { id: "13", label: "MTN" },
  { id: "6", label: "Telecel" },
  { id: "7", label: "AT" },
] as const;

export function PaymentPanel({
  orderId,
  amount,
  phone,
  demo,
  live,
}: {
  orderId: string;
  amount: string;
  phone: string;
  demo: boolean;
  live: boolean;
}) {
  const router = useRouter();
  const [channel, setChannel] = useState<(typeof networks)[number]["id"]>("13");
  const [payer, setPayer] = useState(phone);
  const [otp, setOtp] = useState("");
  const [needsOtp, setNeedsOtp] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await startMobileMoney({ orderId, channel, phone: payer, otp: needsOtp ? otp : undefined });
    setPending(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    if (result.status === "otp_required") {
      setNeedsOtp(true);
      setMessage(result.message || "Enter the code sent to your phone.");
      return;
    }
    setMessage(result.message || "Approve the prompt on your phone.");
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      const status = await refreshPayment(orderId);
      if (status.status === "paid") {
        router.refresh();
        return;
      }
      if (status.status === "failed") {
        setMessage(status.message || "Payment failed.");
        return;
      }
    }
  }

  return (
    <div className="rounded-[28px] border border-neutral-200 p-6">
      <h2 className="text-xl font-extrabold">Pay {amount}</h2>
      <p className="mt-1 text-sm text-neutral-500">Ghana cedis via Moolre. Choose mobile money or a hosted payment link.</p>
      {live ? (
        <form onSubmit={pay} className="mt-4 space-y-3">
          <div className="flex gap-2">
            {networks.map((network) => (
              <button type="button" key={network.id} onClick={() => setChannel(network.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${channel === network.id ? "bg-neutral-950 text-white" : "bg-neutral-100"}`}>
                {network.label}
              </button>
            ))}
          </div>
          <input value={payer} onChange={(event) => setPayer(event.target.value)} className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm" placeholder="0553140985" />
          {needsOtp ? <input value={otp} onChange={(event) => setOtp(event.target.value)} className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm" placeholder="OTP code" /> : null}
          <button disabled={pending} className="w-full rounded-full bg-brand py-3 text-sm font-bold text-white disabled:opacity-60">
            {pending ? "Contacting Moolre..." : needsOtp ? "Confirm code" : "Send mobile money prompt"}
          </button>
          <button
            type="button"
            className="w-full rounded-full border border-neutral-300 py-3 text-sm font-bold"
            onClick={async () => {
              const result = await startPaymentLink(orderId);
              if (result.url) window.location.href = result.url;
              else setMessage(result.error || "Could not open Moolre checkout.");
            }}
          >
            Pay with Moolre checkout
          </button>
        </form>
      ) : null}
      {demo ? (
        <button
          type="button"
          className="mt-4 w-full rounded-full bg-neutral-950 py-3 text-sm font-bold text-white"
          onClick={async () => {
            setPending(true);
            const result = await completeDemoPayment(orderId);
            setPending(false);
            if (result.error) setMessage(result.error);
            else router.refresh();
          }}
        >
          {pending ? "Confirming..." : "Complete demo payment"}
        </button>
      ) : null}
      {demo ? <p className="mt-3 text-xs leading-5 text-neutral-500">Moolre keys are not set, so this demo marks the order paid and still runs the email and SMS step. Turn demo payments off in admin before going live.</p> : null}
      {message ? <p className="mt-3 text-sm font-semibold text-neutral-700">{message}</p> : null}
    </div>
  );
}
