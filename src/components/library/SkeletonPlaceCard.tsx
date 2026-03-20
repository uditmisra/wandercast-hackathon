export function SkeletonPlaceCard() {
  return (
    <div className="py-5 flex items-start gap-4 border-b border-border/50">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="skeleton h-5 w-40 rounded-md" />
        <div className="skeleton h-4 w-full rounded-md" />
        <div className="skeleton h-3 w-20 rounded-md" />
      </div>
      <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
    </div>
  );
}
