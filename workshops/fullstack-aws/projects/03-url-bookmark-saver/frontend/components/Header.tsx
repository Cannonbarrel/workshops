'use client';

interface HeaderProps {
  onAdd: () => void;
  count: number;
  loading: boolean;
}

export default function Header({ onAdd, count, loading }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <svg className="w-4.5 h-4.5 text-white" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-slate-900 font-bold text-lg leading-none tracking-tight">Stash</h1>
              <p className="text-slate-400 text-xs mt-0.5">URL Bookmark Saver</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {!loading && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                {count} {count === 1 ? 'bookmark' : 'bookmarks'}
              </span>
            )}
            <button onClick={onAdd} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Bookmark</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
