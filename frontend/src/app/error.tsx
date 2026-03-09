/**
 * Error Boundary — Global error handler
 *
 * Catches unhandled errors in the React tree and provides
 * a recovery UI with retry capability.
 */
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
      <div className="text-center">
        <h2 className="mb-2 text-lg font-bold">Something went wrong</h2>
        <p className="mb-4 text-sm text-[hsl(var(--muted))]">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-lg bg-sentinel-600/20 px-4 py-2 text-sm font-medium text-sentinel-400 hover:bg-sentinel-600/30"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
