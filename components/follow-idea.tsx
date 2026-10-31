"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleIdeaFollow } from "@/app/actions/store";

export function FollowIdea({ ideaId, following, signedIn }: { ideaId: string; following: boolean; signedIn: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(following);
  return (
    <button
      type="button"
      onClick={async () => {
        if (!signedIn) {
          router.push("/login?next=/following");
          return;
        }
        const result = await toggleIdeaFollow(ideaId);
        if (result.following != null) setSaved(result.following);
        router.refresh();
      }}
      className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-bold"
    >
      {saved ? "Following" : "Follow board"}
    </button>
  );
}
