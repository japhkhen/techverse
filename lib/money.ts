export const USD_TO_GHS = 15.5;

export const REGIONS = {
  GH: { code: "GH", label: "GH", currency: "GHS", rate: USD_TO_GHS, locale: "en-GH", flag: "🇬🇭" },
  US: { code: "US", label: "US", currency: "USD", rate: 1, locale: "en-US", flag: "🇺🇸" },
  UK: { code: "UK", label: "UK", currency: "GBP", rate: 0.78, locale: "en-GB", flag: "🇬🇧" },
  AE: { code: "AE", label: "UAE", currency: "AED", rate: 3.67, locale: "en-AE", flag: "🇦🇪" },
} as const;

export type RegionCode = keyof typeof REGIONS;

export const STORE = {
  name: "TechVerse",
  tagline: "Discover. Shop. Upgrade.",
  city: "Accra",
  country: "Ghana",
  phones: ["02562063.83", "0553140985"] as const,
};

export function formatMoney(amountUsd: number, region: RegionCode) {
  const current = REGIONS[region];
  return new Intl.NumberFormat(current.locale, {
    style: "currency",
    currency: current.currency,
  }).format(amountUsd * current.rate);
}

export function formatGhs(amount: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(amount);
}

export function formatLikes(value: number) {
  if (value >= 1000) {
    const compact = value / 1000;
    const text = compact >= 10 ? String(Math.round(compact)) : compact.toFixed(1).replace(/\.0$/, "");
    return `${text}k`;
  }
  return String(value);
}

export function shippingUsd(subtotal: number, country: string) {
  if (country === "Ghana") return subtotal >= 75 ? 0 : 8;
  return 25;
}
