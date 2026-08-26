export default function Loading() {
  return (
    <div className="shell section">
      <div className="animate-pulse space-y-6">
        <div className="skeleton-shimmer h-14 w-2/5 rounded-full" />
        <div className="skeleton-shimmer h-5 w-3/5 rounded-full" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-[2rem] border border-line bg-panel p-4">
              <div className="skeleton-shimmer h-64 rounded-[1.5rem]" />
              <div className="skeleton-shimmer mt-4 h-6 w-1/3 rounded-full" />
              <div className="skeleton-shimmer mt-3 h-10 w-3/4 rounded-full" />
              <div className="skeleton-shimmer mt-4 h-24 rounded-[1.5rem]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
