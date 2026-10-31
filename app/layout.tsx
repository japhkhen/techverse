import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { getSession } from "@/lib/data";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "TechVerse — Discover. Shop. Upgrade.", template: "%s · TechVerse" },
  description: "TechVerse in Accra, Ghana sells watches, audio, drones, smart home devices, and accessories.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let follows: string[] = [];
  try {
    follows = (await getSession()).follows;
  } catch {
    follows = [];
  }

  return (
    <html lang="en">
      <body className={`${jakarta.variable} antialiased`}>
        <Providers initialFollows={follows}>{children}</Providers>
      </body>
    </html>
  );
}
