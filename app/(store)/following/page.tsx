import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getIdeas, getProducts, getSession } from "@/lib/data";

export const metadata = { title: "Following" };

export default async function FollowingPage() {
  const session = await getSession();
  if (!session.user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold">Following</h1>
        <p className="mt-2 text-sm text-neutral-500">Sign in to keep the gadgets and idea boards you heart.</p>
        <Link href="/login?next=/following" className="mt-5 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-bold text-white">Sign in</Link>
      </div>
    );
  }
  const [products, ideas] = await Promise.all([getProducts(), getIdeas()]);
  const saved = products.filter((product) => session.follows.includes(product.id));
  const boards = ideas.filter((idea) => session.ideaFollows.includes(idea.id));
  return (
    <div className="mx-auto w-full max-w-[1920px] px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Following</h1>
      <section className="mt-6">
        <h2 className="text-xl font-extrabold">Saved gadgets</h2>
        {saved.length === 0 ? <p className="mt-3 text-sm text-neutral-500">Heart a product to keep it here.</p> : (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{saved.map((product) => <ProductCard key={product.id} product={product} signedIn />)}</div>
        )}
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-extrabold">Boards</h2>
        {boards.length === 0 ? <p className="mt-3 text-sm text-neutral-500">Follow an idea board to see it here.</p> : (
          <div className="mt-4 flex flex-wrap gap-3">{boards.map((idea) => <Link key={idea.id} href={`/ideas/${idea.slug}`} className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold">{idea.title}</Link>)}</div>
        )}
      </section>
    </div>
  );
}
