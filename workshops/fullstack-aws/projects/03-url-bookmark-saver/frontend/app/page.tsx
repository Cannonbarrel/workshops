'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ArchitectureSection from '@/components/ArchitectureSection';
import AddBookmarkForm from '@/components/AddBookmarkForm';
import BookmarkCard from '@/components/BookmarkCard';
import EmptyState from '@/components/EmptyState';
import SkeletonCard from '@/components/SkeletonCard';
import Toast from '@/components/Toast';
import Footer from '@/components/Footer';
import { getBookmarks, createBookmark, deleteBookmark } from '@/lib/api';
import type { Bookmark, ToastState } from '@/types';

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const isOffline = message.toLowerCase().includes('cannot reach') ||
                    message.toLowerCase().includes('timed out') ||
                    message.toLowerCase().includes('unavailable');
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="font-semibold text-zinc-800 mb-1.5">
        {isOffline ? 'API Unreachable' : 'Failed to load bookmarks'}
      </p>
      <p className="text-sm text-zinc-500 mb-1 max-w-sm mx-auto">{message}</p>
      {isOffline && (
        <p className="text-xs text-zinc-400 mb-5 max-w-sm mx-auto">
          Run <code className="px-1.5 py-0.5 bg-zinc-100 rounded font-mono text-zinc-600">bash scripts/deploy.sh</code> to provision the backend, or start a local API on port 3001.
        </p>
      )}
      <button onClick={onRetry} className="btn-secondary text-sm mt-3">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Retry
      </button>
    </div>
  );
}

export default function Home() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [toast, setToast]         = useState<ToastState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const appRef = useRef<HTMLElement>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBookmarks(await getBookmarks());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  function scrollToApp() {
    appRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleAdd(title: string, url: string) {
    const bookmark = await createBookmark(title, url);
    setBookmarks((prev) => [bookmark, ...prev]);
    showToast('Bookmark saved!', 'success');
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteBookmark(id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      showToast('Bookmark removed', 'success');
    } catch {
      showToast('Failed to delete bookmark', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar onGetStarted={scrollToApp} />

      <HeroSection onGetStarted={scrollToApp} />

      <ArchitectureSection />

      {/* ── App section ────────────────────────────────── */}
      <section id="app" ref={appRef} className="bg-white py-20">
        <div className="section-container">

          {/* Section header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50
                              border border-indigo-100 text-xs font-semibold text-indigo-600
                              uppercase tracking-widest mb-3">
                Live App
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                Your Bookmarks
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                Saved to DynamoDB via Lambda. Changes are instant.
              </p>
            </div>
            {!loading && (
              <div className="hidden sm:flex flex-col items-end gap-1">
                <span className="text-3xl font-extrabold text-zinc-900">{bookmarks.length}</span>
                <span className="text-xs text-zinc-400 uppercase tracking-wide">
                  {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
                </span>
              </div>
            )}
          </div>

          {/* Add form */}
          <AddBookmarkForm onAdd={handleAdd} />

          {/* Bookmark grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchBookmarks} />
          ) : bookmarks.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {bookmarks.map((b) => (
                <BookmarkCard
                  key={b.id}
                  bookmark={b}
                  onDelete={handleDelete}
                  deleting={deletingId === b.id}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
