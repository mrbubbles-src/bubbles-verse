export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen flex flex-col justify-center items-center text-center animate-pulse ">
      <div className="text-2xl font-mono text-muted-foreground mb-2">
        &gt; compiling UI...
        <span className="sr-only">Loading interface…</span>
      </div>
      <div
        className="h-1 w-48 bg-muted rounded overflow-hidden relative"
        aria-hidden="true">
        <div className="absolute inset-0 bg-primary animate-ping" />
      </div>
    </div>
  );
}
