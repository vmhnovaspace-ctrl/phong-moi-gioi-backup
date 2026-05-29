export default function LoadingLandlordSharePage() {
  return <ShareLoading title="Đang tải kho phòng..." />;
}

function ShareLoading({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-8 w-2/3 animate-pulse rounded bg-slate-100" />
          <p className="mt-4 text-sm font-semibold text-slate-500">{title}</p>
        </div>
        <div className="grid gap-3">
          <div className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    </main>
  );
}
