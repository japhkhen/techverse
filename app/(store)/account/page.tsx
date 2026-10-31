import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { ProfileForm } from "@/components/profile-form";
import { getSession } from "@/lib/data";
import { redirect } from "next/navigation";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session.user || !session.profile) redirect("/login?next=/account");
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-3xl font-extrabold">Account</h1>
      <p className="mt-1 text-sm text-neutral-500">{session.profile.email}</p>
      <div className="mt-6"><ProfileForm profile={session.profile} /></div>
      <div className="mt-6 flex gap-3 text-sm font-semibold">
        <Link href="/orders" className="rounded-full border border-neutral-200 px-4 py-2">Orders</Link>
        <Link href="/following" className="rounded-full border border-neutral-200 px-4 py-2">Following</Link>
        {session.profile.role === "admin" ? <Link href="/admin" className="rounded-full bg-brand px-4 py-2 text-white">Admin</Link> : null}
      </div>
      <form action={signOut} className="mt-6">
        <button className="text-sm font-semibold text-neutral-500">Sign out</button>
      </form>
    </div>
  );
}
