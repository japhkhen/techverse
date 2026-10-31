"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyOrder } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";
import type { PaidNotice } from "@/lib/types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");
  return supabase;
}

export async function saveProduct(_prev: { error?: string } | null, formData: FormData) {
  const supabase = await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price"));
  const compareRaw = String(formData.get("compare") || "").trim();
  const stock = Number(formData.get("stock"));
  const sku = String(formData.get("sku") || "").trim();
  const id = String(formData.get("id") || "");
  let slug = String(formData.get("slug") || "").trim();
  if (!slug) slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!name || !description || !sku || !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock)) {
    return { error: "Enter a name, description, SKU, price, and stock." };
  }
  const { data: category } = await supabase.from("categories").select("id").eq("slug", String(formData.get("category") || "")).maybeSingle();
  let imageUrl = String(formData.get("imageUrl") || "");
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (file.size > 5_000_000) return { error: "Use an image under 5 MB." };
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]+/g, "")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type || "image/jpeg" });
    if (error) return { error: error.message };
    imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }
  if (!imageUrl) return { error: "Add a product image." };
  const row = {
    name,
    slug,
    description,
    price_usd: price,
    compare_at_usd: compareRaw ? Number(compareRaw) : null,
    stock: Math.max(0, Math.floor(stock)),
    sku,
    image_url: imageUrl,
    category_id: category?.id ?? null,
    badge: String(formData.get("badge") || "") || null,
    is_trending: formData.get("trending") === "on",
    is_deal: formData.get("deal") === "on",
    is_new: formData.get("fresh") === "on",
  };
  const result = id
    ? await supabase.from("products").update(row).eq("id", id)
    : await supabase.from("products").insert(row);
  if (result.error) return { error: result.error.message };
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}

export async function updateStock(formData: FormData) {
  const supabase = await requireAdmin();
  const stock = Number(formData.get("stock"));
  if (!Number.isFinite(stock) || stock < 0) return;
  await supabase.from("products").update({ stock: Math.floor(stock) }).eq("id", String(formData.get("id")));
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
}

export async function updateOrderStatus(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const allowed = ["processing", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) return;
  if (status === "cancelled") {
    const { error } = await supabase.rpc("cancel_order", { p_order_id: id });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
  }
  if (status === "shipped" || status === "delivered") {
    const { data: order } = await supabase.from("orders").select("*, order_items(name, quantity, unit_price_usd)").eq("id", id).single();
    if (order) {
      const notice: PaidNotice = {
        fulfilled: true,
        order_id: order.id,
        order_number: order.order_number,
        email: order.email,
        phone: order.phone,
        full_name: order.full_name,
        total_ghs: Number(order.total_ghs),
        total_usd: Number(order.total_usd),
        items: order.order_items,
      };
      await notifyOrder(notice, status);
    }
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${id}`);
}

export async function setDemoPayments(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.rpc("set_demo_payments", { p_enabled: formData.get("enabled") === "true" });
  revalidatePath("/admin");
}

export async function setExchangeRate(formData: FormData) {
  const supabase = await requireAdmin();
  const rate = Number(formData.get("rate"));
  const { error } = await supabase.rpc("update_exchange_rate", { p_rate: rate });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
