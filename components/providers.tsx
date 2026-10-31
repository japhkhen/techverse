"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { REGIONS, type RegionCode } from "@/lib/money";
import type { CartItem } from "@/lib/types";

type ShopContextValue = {
  region: RegionCode;
  setRegion: (region: RegionCode) => void;
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQty: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  count: number;
  subtotal: number;
  follows: string[];
  setFollows: (ids: string[]) => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);
const CART_KEY = "techverse-cart";
const REGION_KEY = "techverse-region";

export function Providers({
  children,
  initialFollows,
}: {
  children: React.ReactNode;
  initialFollows: string[];
}) {
  const [region, setRegionState] = useState<RegionCode>("US");
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [follows, setFollows] = useState(initialFollows);

  useEffect(() => {
    const storedRegion = localStorage.getItem(REGION_KEY) as RegionCode | null;
    if (storedRegion && storedRegion in REGIONS) setRegionState(storedRegion);
    const storedCart = localStorage.getItem(CART_KEY);
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart) as CartItem[]);
      } catch {
        localStorage.removeItem(CART_KEY);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    setFollows(initialFollows);
  }, [initialFollows]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    localStorage.setItem(REGION_KEY, region);
  }, [items, region, ready]);

  const value = useMemo<ShopContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0);
    return {
      region,
      setRegion: setRegionState,
      items,
      addItem: (item) => {
        setItems((current) => {
          const existing = current.find((entry) => entry.productId === item.productId);
          if (!existing) return [...current, item];
          return current.map((entry) =>
            entry.productId === item.productId
              ? { ...entry, quantity: Math.min(entry.stock, entry.quantity + item.quantity) }
              : entry,
          );
        });
      },
      updateQty: (productId, quantity) => {
        setItems((current) =>
          current.map((entry) =>
            entry.productId === productId
              ? { ...entry, quantity: Math.max(1, Math.min(entry.stock, quantity)) }
              : entry,
          ),
        );
      },
      removeItem: (productId) => setItems((current) => current.filter((entry) => entry.productId !== productId)),
      clearCart: () => setItems([]),
      count,
      subtotal,
      follows,
      setFollows,
    };
  }, [region, items, follows]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used within Providers");
  return context;
}
