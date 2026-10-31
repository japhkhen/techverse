"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/store";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [message, setMessage] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const result = await updateProfile({
          fullName: String(form.get("fullName") || ""),
          phone: String(form.get("phone") || ""),
        });
        setMessage(result.error || result.message || "");
      }}
    >
      <input name="fullName" defaultValue={profile.full_name ?? ""} className="h-11 w-full rounded-xl border border-neutral-200 px-3" />
      <input name="phone" defaultValue={profile.phone ?? ""} className="h-11 w-full rounded-xl border border-neutral-200 px-3" />
      {message ? <p className="text-sm text-neutral-600">{message}</p> : null}
      <button className="h-11 rounded-full bg-neutral-950 px-5 text-sm font-bold text-white">Save profile</button>
    </form>
  );
}
