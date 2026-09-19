export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-6 lg:p-8" aria-busy="true" aria-label="Loading Amezing Limited">
      <div className="mx-auto w-full max-w-[1500px] space-y-5">
        <div className="h-8 w-44 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-72 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    </main>
  );
}
