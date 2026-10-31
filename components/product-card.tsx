"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/components/providers";
import { toggleFollow } from "@/app/actions/store";
import { formatLikes, formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

export function ProductCard({ product, signedIn }: { product: Product; signedIn: boolean }) {
  const { region, follows, setFollows } = useShop();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const saved = follows.includes(product.id);
  const likes = product.likes + (saved ? 0 : 0);

  async function onHeart() {
    if (!signedIn) {
      router.push(`/login?next=/product/${product.slug}`);
      return;
    }
    setPending(true);
    const result = await toggleFollow(product.id);
    setPending(false);
    if (result.following != null) {
      setFollows(result.following ? [...new Set([...follows, product.id])] : follows.filter((id) => id !== product.id));
      router.refresh();
    }
  }

  return (
    <article>
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-2xl bg-[#f6f6f6]"
      >
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 180px, 50vw"
          className="object-contain p-6 transition duration-300 hover:scale-105"
        />
        {product.badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-brand">
            {product.badge}
          </span>
        ) : null}
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <Link href={`/product/${product.slug}`} className="text-sm font-semibold leading-snug hover:underline">
            {product.name}
          </Link>
          <p className="mt-0.5 text-sm text-neutral-500">{formatMoney(product.price_usd, region)}</p>
        </div>
        <button
          type="button"
          onClick={onHeart}
          disabled={pending}
          className="flex items-center gap-1 text-xs text-neutral-500"
          aria-label={saved ? "Remove from following" : "Save to following"}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-brand text-brand" : ""}`} />
          {formatLikes(saved ? Math.max(likes, product.likes) : product.likes)}
        </button>
      </div>
    </article>
  );
}
