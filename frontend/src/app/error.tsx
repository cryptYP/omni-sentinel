"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="mb-2 text-lg font-bold">Something went wrong</h2>
        <p className="mb-4 text-sm text-[hsl(var(--muted))]">{error.message}</p>
        <button onClick={reset} className="btn-primary text-sm">
          Try again
        </button>
      </div>
    </div>
  );
}
