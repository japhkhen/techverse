"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp } from "@/app/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <input name="email" type="email" required placeholder="Email" className="h-11 w-full rounded-xl border border-neutral-200 px-3" />
      <input name="password" type="password" required placeholder="Password" className="h-11 w-full rounded-xl border border-neutral-200 px-3" />
      {state?.error ? <p className="text-sm font-semibold text-brand">{state.error}</p> : null}
      <button disabled={pending} className="h-11 w-full rounded-full bg-brand text-sm font-bold text-white">Sign in</button>
      <p className="text-sm text-neutral-500">New here? <Link href="/signup" className="font-semibold text-neutral-950">Create an account</Link></p>
      <p className="text-sm text-neutral-500"><Link href="/forgot" className="font-semibold">Forgot password</Link></p>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, null);
  return (
    <form action={action} className="space-y-3">
      <input name="fullName" required placeholder="Full name" className="h-11 w-full rounded-xl border border-neutral-200 px-3" />
      <input name="email" type="email" required placeholder="Email" className="h-11 w-full rounded-xl border border-neutral-200 px-3" />
      <input name="phone" required placeholder="Phone" className="h-11 w-full rounded-xl border border-neutral-200 px-3" />
      <input name="password" type="password" required minLength={6} placeholder="Password" className="h-11 w-full rounded-xl border border-neutral-200 px-3" />
      {state?.error ? <p className="text-sm font-semibold text-brand">{state.error}</p> : null}
      {state?.message ? <p className="text-sm text-neutral-600">{state.message}</p> : null}
      <button disabled={pending} className="h-11 w-full rounded-full bg-brand text-sm font-bold text-white">Create account</button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  return (
    <form action={action} className="space-y-3">
      <input name="email" type="email" required placeholder="Email" className="h-11 w-full rounded-xl border border-neutral-200 px-3" />
      {state?.error ? <p className="text-sm font-semibold text-brand">{state.error}</p> : null}
      {state?.message ? <p className="text-sm text-neutral-600">{state.message}</p> : null}
      <button disabled={pending} className="h-11 w-full rounded-full bg-brand text-sm font-bold text-white">Send reset link</button>
    </form>
  );
}
