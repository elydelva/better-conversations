import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <h1 className="text-3xl font-bold tracking-tight">Better Conversations Playground</h1>
      <p className="max-w-md text-center text-zinc-400">
        Explore the API and experiment with policy resolution.
      </p>
      <nav className="flex gap-4">
        <Link
          href="/playground"
          className="rounded-lg bg-amber-500 px-6 py-3 font-medium text-zinc-950 transition hover:bg-amber-400"
        >
          Policy Playground
        </Link>
      </nav>
    </main>
  );
}
