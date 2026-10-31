export type Category = {
  slug: string;
  name: string;
  tagline: string | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_usd: number;
  compare_at_usd: number | null;
  image_url: string;
  stock: number;
  likes: number;
  rating: number;
  badge: string | null;
  is_trending: boolean;
  is_deal: boolean;
  is_new: boolean;
  sku: string;
  category: Category | null;
};

export type Idea = {
  id: string;
  slug: string;
  title: string;
  image_url: string;
  idea_count: number;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceUsd: number;
  image: string;
  quantity: number;
  stock: number;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed";

export type Profile = {
  full_name: string | null;
  role: "customer" | "admin";
  phone: string | null;
  email: string;
};

export type PaidNotice = {
  fulfilled?: boolean;
  already?: boolean;
  order_id?: string;
  order_number?: string;
  email?: string;
  phone?: string;
  full_name?: string;
  total_ghs?: number;
  total_usd?: number;
  items?: { name: string; quantity: number; unit_price_usd: number }[];
};
