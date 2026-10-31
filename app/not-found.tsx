import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-3xl font-extrabold">Page not found</h1>
      <Link href="/" className="mt-5 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-bold text-white">Back to TechVerse</Link>
    </div>
  );
}
