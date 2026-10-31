import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/data";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession().catch(() => null);
  return (
    <>
      <Suspense fallback={<div className="h-28 border-b border-neutral-200" />}>
        <SiteHeader signedIn={Boolean(session?.user)} admin={session?.profile?.role === "admin"} />
      </Suspense>
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
