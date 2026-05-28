function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-neutral-800 ${className}`} />;
}

export function SkeletonCluster() {
  return (
    <div className="rounded-xl border border-neutral-800 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Pulse className="h-4 w-40" />
        <Pulse className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-3">
        <Pulse className="h-8 w-10" />
        <Pulse className="flex-1 h-1.5" />
        <Pulse className="h-3 w-8" />
      </div>
      <Pulse className="h-3 w-full" />
      <Pulse className="h-3 w-3/4" />
    </div>
  );
}

export function SkeletonResults() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 space-y-2">
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-3/4" />
      </div>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 space-y-2">
        <Pulse className="h-3 w-24 mb-3" />
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-5/6" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCluster key={i} />)}
      </div>
    </div>
  );
}
