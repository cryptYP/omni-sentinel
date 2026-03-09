/**
 * 404 Page — Route not found handler
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
      <div className="text-center">
        <h2 className="mb-2 text-lg font-bold">404 — Not Found</h2>
        <p className="text-sm text-[hsl(var(--muted))]">This page does not exist.</p>
      </div>
    </div>
  );
}
