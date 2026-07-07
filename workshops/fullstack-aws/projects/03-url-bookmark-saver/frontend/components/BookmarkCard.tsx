'use client';

import type { Bookmark } from '@/types';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function getFavicon(url: string): string {
  try {
    const { protocol, hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${protocol}//${hostname}&sz=64`;
  } catch { return ''; }
}

export default function BookmarkCard({ bookmark, onDelete, deleting }: BookmarkCardProps) {
  const domain  = getDomain(bookmark.url);
  const favicon = getFavicon(bookmark.url);

  return (
    <div className="card p-5 flex flex-col animate-fade-in">
      {/* Top */}
      <div className="flex items-start gap-3.5 mb-4">
        {/* Favicon */}
        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center
                        flex-shrink-0 overflow-hidden border border-zinc-100">
          {favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt=""
              width={22}
              height={22}
              className="w-5 h-5"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            </svg>
          )}
        </div>

        {/* Title + domain */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 text-sm leading-snug line-clamp-2 mb-1">
            {bookmark.title}
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100
                           text-zinc-500 text-xs font-medium truncate max-w-full">
            {domain}
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom */}
      <div className="flex items-center justify-between pt-3.5 border-t border-zinc-100 mt-2">
        <span className="text-xs text-zinc-400">{formatDate(bookmark.createdAt)}</span>

        <div className="flex items-center gap-1">
          {/* Open */}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                       text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50
                       transition-all duration-150
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            title="Open link"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {/* Delete */}
          <button
            onClick={() => onDelete(bookmark.id)}
            disabled={deleting}
            className="btn-danger-icon"
            title="Delete"
          >
            {deleting ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
