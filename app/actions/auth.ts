"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

async function origin() {
  const headerStore = await headers();
  return headerStore.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function signIn(_prev: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = safeNext(String(formData.get("next") || "/"));
  const parsed = z.object({ email: z.string().email(), password: z.string().min(6) }).safeParse({ email, password });
  if (!parsed.success) return { error: "Enter a valid email and a password of at least 6 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  redirect(next);
}

export async function signUp(_prev: { error?: string; message?: string } | null, formData: FormData) {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2),
      email: z.string().trim().email(),
      phone: z.string().trim().min(10),
      password: z.string().min(6),
    })
    .safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { error: "Check your name, email, phone, and password." };

  const supabase = await createClient();
  const site = await origin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${site}/auth/callback`,
      data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
    },
  });
  if (error) return { error: error.message };
  if (!data.session) {
    return { message: "Account created. Confirm the email, then sign in." };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: { error?: string; message?: string } | null, formData: FormData) {
  const email = String(formData.get("email") || "");
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) return { error: "Enter a valid email." };
  const supabase = await createClient();
  const site = await origin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${site}/auth/callback?next=/account`,
  });
  if (error) return { error: error.message };
  return { message: "If that email is registered, a reset link is on the way." };
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (password.length < 6) return { error: "Use at least 6 characters." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/account");
}
