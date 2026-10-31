import { createClient } from "@/lib/supabase/server";
import type { Idea, Product, Profile } from "@/lib/types";

function asNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapProduct(row: Record<string, unknown>): Product {
  const category = row.category as Product["category"] | Product["category"][] | null;
  const categoryValue = Array.isArray(category) ? category[0] ?? null : category;
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    price_usd: asNumber(row.price_usd as number | string),
    compare_at_usd: row.compare_at_usd == null ? null : asNumber(row.compare_at_usd as number | string),
    image_url: String(row.image_url),
    stock: asNumber(row.stock as number | string),
    likes: asNumber(row.likes as number | string),
    rating: asNumber(row.rating as number | string),
    badge: row.badge ? String(row.badge) : null,
    is_trending: Boolean(row.is_trending),
    is_deal: Boolean(row.is_deal),
    is_new: Boolean(row.is_new),
    sku: String(row.sku),
    category: categoryValue,
  };
}

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(slug, name, tagline)")
    .order("likes", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
}

export async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(slug, name, tagline)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProduct(data as Record<string, unknown>) : null;
}

export async function getIdeas() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ideas").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as Idea[];
}

export async function getIdea(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ideas").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const { data: links, error: linkError } = await supabase
    .from("idea_products")
    .select("product:products(*, category:categories(slug, name, tagline))")
    .eq("idea_id", data.id);
  if (linkError) throw new Error(linkError.message);
  const products = (links ?? [])
    .map((link) => {
      const product = (link as { product: Record<string, unknown> | Record<string, unknown>[] }).product;
      const row = Array.isArray(product) ? product[0] : product;
      return row ? mapProduct(row) : null;
    })
    .filter((product): product is Product => Boolean(product));
  return { idea: data as Idea, products };
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, profile: null as Profile | null, follows: [] as string[], ideaFollows: [] as string[] };
  }
  const [{ data: profile }, { data: follows }, { data: ideaFollows }] = await Promise.all([
    supabase.from("profiles").select("full_name, role, phone, email").eq("id", user.id).maybeSingle(),
    supabase.from("follows").select("product_id").eq("user_id", user.id),
    supabase.from("idea_follows").select("idea_id").eq("user_id", user.id),
  ]);
  return {
    user,
    profile: (profile as Profile | null) ?? null,
    follows: (follows ?? []).map((row) => row.product_id as string),
    ideaFollows: (ideaFollows ?? []).map((row) => row.idea_id as string),
  };
}

export async function getUsdToGhs() {
  const supabase = await createClient();
  const { data } = await supabase.from("public_settings").select("value").eq("key", "usd_to_ghs").maybeSingle();
  const rate = Number(data?.value ?? 15.5);
  return Number.isFinite(rate) && rate > 0 ? rate : 15.5;
}

export async function demoPaymentsEnabled() {
  const supabase = await createClient();
  const { data } = await supabase.from("public_settings").select("value").eq("key", "demo_payments").maybeSingle();
  return data?.value === "true";
}
