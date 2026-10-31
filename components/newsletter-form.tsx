"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/app/actions/store";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-5 flex flex-col gap-3 sm:flex-row"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await subscribeNewsletter(email);
        setPending(false);
        setMessage(result.error || result.message || "");
        if (!result.error) setEmail("");
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Enter your email"
        className="h-11 flex-1 rounded-full border border-neutral-200 px-4 text-sm outline-none focus:ring-2 focus:ring-brand/30"
      />
      <button disabled={pending} className="h-11 rounded-full bg-brand px-5 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Joining..." : "Subscribe"}
      </button>
      {message ? <p className="w-full text-xs text-neutral-500 sm:absolute sm:mt-12">{message}</p> : null}
    </form>
  );
}
