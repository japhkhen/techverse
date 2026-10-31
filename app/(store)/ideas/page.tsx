import Image from "next/image";
import Link from "next/link";
import { getIdeas } from "@/lib/data";

export const metadata = { title: "Ideas" };

export default async function IdeasPage() {
  const ideas = await getIdeas();
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Ideas for your next upgrade</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ideas.map((idea) => (
          <Link key={idea.id} href={`/ideas/${idea.slug}`} className="relative aspect-[16/10] overflow-hidden rounded-3xl">
            <Image src={idea.image_url} alt={idea.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-lg font-extrabold">{idea.title}</p>
              <p className="text-sm text-white/80">{idea.idea_count} ideas</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
