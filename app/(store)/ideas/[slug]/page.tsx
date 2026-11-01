import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowIdea } from "@/components/follow-idea";
import { ProductCard } from "@/components/product-card";
import { getIdea, getSession } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getIdea(slug);
  return { title: data?.idea.title ?? "Ideas" };
}

export default async function IdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, session] = await Promise.all([getIdea(slug), getSession()]);
  if (!data) notFound();
  return (
    <div className="mx-auto w-full max-w-[1920px] px-4 py-8 sm:px-6">
      <Link href="/ideas" className="text-xs font-semibold text-neutral-500">All ideas</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{data.idea.title}</h1>
          <p className="text-sm text-neutral-500">{data.idea.idea_count} ideas</p>
        </div>
        <FollowIdea ideaId={data.idea.id} following={session.ideaFollows.includes(data.idea.id)} signedIn={Boolean(session.user)} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data.products.map((product) => <ProductCard key={product.id} product={product} signedIn={Boolean(session.user)} />)}
      </div>
    </div>
  );
}
