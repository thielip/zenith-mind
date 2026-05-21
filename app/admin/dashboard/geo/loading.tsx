export default function GeoLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-64 rounded-lg bg-slate-800/60" />
      <div className="h-16 rounded-xl bg-slate-800/40" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-800/40" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 rounded-xl bg-slate-800/40" />
        <div className="h-72 rounded-xl bg-slate-800/40" />
      </div>
    </div>
  );
}
