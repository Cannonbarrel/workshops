export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-5 border border-zinc-200">
        <svg className="w-7 h-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </div>
      <p className="font-semibold text-zinc-700 mb-1.5">No bookmarks yet</p>
      <p className="text-sm text-zinc-400 max-w-xs">
        Save your first URL above — it&apos;ll appear here instantly.
      </p>
    </div>
  );
}
