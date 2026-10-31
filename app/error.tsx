"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-3xl font-extrabold">Something went wrong</h1>
      <p className="mt-2 text-sm text-neutral-600">{error.message}</p>
      <button type="button" onClick={reset} className="mt-5 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white">Try again</button>
    </div>
  );
}
