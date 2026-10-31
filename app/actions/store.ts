"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().min(10, "Enter a phone number").max(20),
  address: z.string().trim().min(3, "Enter a delivery address").max(160),
  city: z.string().trim().min(2).max(60),
  regionName: z.string().trim().min(2).max(60),
  country: z.enum(["Ghana", "United States", "United Kingdom", "United Arab Emirates"]),
  notes: z.string().trim().max(300).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1, "Your cart is empty")
    .max(30),
});

export async function placeOrder(input: unknown) {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to check out." };

  const { data, error } = await supabase.rpc("place_order", {
    p_full_name: parsed.data.fullName,
    p_phone: parsed.data.phone,
    p_address: parsed.data.address,
    p_city: parsed.data.city,
    p_region_name: parsed.data.regionName,
    p_country: parsed.data.country,
    p_notes: parsed.data.notes ?? "",
    p_items: parsed.data.items,
  });
  if (error) return { error: error.message };
  revalidatePath("/orders");
  return { order: data as { order_id: string; order_number: string; total_ghs: number; total_usd: number } };
}

export async function toggleFollow(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to save gadgets." };
  const { data, error } = await supabase.rpc("toggle_follow", { p_product_id: productId });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/following");
  revalidatePath("/shop");
  return { following: Boolean(data) };
}

export async function toggleIdeaFollow(ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to follow a board." };
  const { data, error } = await supabase.rpc("toggle_idea_follow", { p_idea_id: ideaId });
  if (error) return { error: error.message };
  revalidatePath("/following");
  return { following: Boolean(data) };
}

export async function subscribeNewsletter(email: string) {
  const parsed = z.string().trim().email().safeParse(email);
  if (!parsed.success) return { error: "Enter a valid email." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("subscribe_newsletter", { p_email: parsed.data });
  if (error) return { error: error.message };
  if (data === "exists") return { message: "You are already on the list." };
  return { message: "You are subscribed. We will send new arrivals and deals." };
}

export async function updateProfile(input: { fullName: string; phone: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  if (fullName.length < 2) return { error: "Enter your full name." };
  const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/account");
  return { message: "Profile saved." };
}
