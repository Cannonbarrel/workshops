'use client';

import { useState } from 'react';

interface AddBookmarkFormProps {
  onAdd: (title: string, url: string) => Promise<void>;
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function AddBookmarkForm({ onAdd }: AddBookmarkFormProps) {
  const [title, setTitle]         = useState('');
  const [url, setUrl]             = useState('');
  const [titleError, setTitleError] = useState('');
  const [urlError, setUrlError]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]   = useState('');

  function validate(): boolean {
    let ok = true;
    if (!title.trim()) {
      setTitleError('Title is required'); ok = false;
    } else if (title.trim().length > 200) {
      setTitleError('Max 200 characters'); ok = false;
    } else {
      setTitleError('');
    }

    if (!url.trim()) {
      setUrlError('URL is required'); ok = false;
    } else if (!isValidUrl(url.trim())) {
      setUrlError('Must start with http:// or https://'); ok = false;
    } else {
      setUrlError('');
    }
    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError('');
    try {
      await onAdd(title.trim(), url.trim());
      setTitle('');
      setUrl('');
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden mb-10">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/60 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-500/30">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-800">Save a bookmark</p>
          <p className="text-xs text-zinc-400">Add a URL to your personal cloud stash</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Title */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(''); }}
              placeholder="e.g. Terraform Documentation"
              className={`input-field ${titleError ? 'error' : ''}`}
              maxLength={200}
              disabled={submitting}
            />
            {titleError && (
              <p className="mt-1 text-xs text-red-500">{titleError}</p>
            )}
          </div>

          {/* URL */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
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
              <p className="mt-1 text-xs text-red-500">{urlError}</p>
            )}
          </div>

          {/* Submit */}
          <div className="sm:pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full sm:w-auto px-6 py-2.5 whitespace-nowrap"
            >
              {submitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  Save
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {apiError && (
          <div className="mt-3 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            {apiError}
          </div>
        )}
      </form>
    </div>
  );
}
