export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 animate-skeleton">
      <div className="flex items-start gap-3.5 mb-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-zinc-100 rounded-md w-3/4" />
          <div className="h-3 bg-zinc-100 rounded-md w-1/3" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3.5 border-t border-zinc-100 mt-6">
        <div className="h-3 bg-zinc-100 rounded-md w-20" />
        <div className="flex gap-1.5">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg" />
          <div className="w-8 h-8 bg-zinc-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
