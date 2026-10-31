import { LoginForm } from "@/components/auth-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/";
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-extrabold">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">Use your TechVerse account to checkout and follow gadgets.</p>
      <LoginForm next={next} />
    </div>
  );
}
