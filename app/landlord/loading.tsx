export default function LandlordLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-44 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200" key={index} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-48 animate-pulse rounded-2xl bg-slate-200" key={index} />
        ))}
      </div>
    </div>
  );
}
