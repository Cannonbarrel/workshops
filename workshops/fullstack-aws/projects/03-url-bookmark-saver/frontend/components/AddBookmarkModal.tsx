'use client';

import { useState, useEffect, useRef } from 'react';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, url: string) => Promise<void>;
}

function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function AddBookmarkModal({ isOpen, onClose, onAdd }: AddBookmarkModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [titleError, setTitleError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setUrl('');
      setTitleError('');
      setUrlError('');
      setApiError('');
      setSubmitting(false);
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  function validate(): boolean {
    let valid = true;
    if (!title.trim()) {
      setTitleError('Title is required');
      valid = false;
    } else if (title.trim().length > 200) {
      setTitleError('Title must be 200 characters or less');
      valid = false;
    } else {
      setTitleError('');
    }

    if (!url.trim()) {
      setUrlError('URL is required');
      valid = false;
    } else if (!isValidUrl(url.trim())) {
      setUrlError('Enter a valid URL starting with http:// or https://');
      valid = false;
    } else {
      setUrlError('');
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError('');
    try {
      await onAdd(title.trim(), url.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save bookmark';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Save a bookmark</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add a URL to your personal stash</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400
                       hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Title
              </label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(''); }}
                placeholder="e.g. Tailwind CSS Documentation"
                className={`input-field ${titleError ? 'error' : ''}`}
                maxLength={200}
                disabled={submitting}
              />
              {titleError && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {titleError}
                </p>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (urlError) setUrlError(''); }}
                placeholder="https://example.com"
                className={`input-field ${urlError ? 'error' : ''}`}
                disabled={submitting}
              />
              {urlError && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {urlError}
                </p>
              )}
            </div>

            {/* API error */}
            {apiError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                {apiError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 pb-5">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 justify-center"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                'Save Bookmark'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
