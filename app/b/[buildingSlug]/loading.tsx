export default function LoadingBuildingSharePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-5">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-8 w-2/3 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-72 animate-pulse rounded-md bg-white shadow-sm" />
        <div className="h-28 animate-pulse rounded-md bg-white shadow-sm" />
      </div>
    </main>
  );
}
