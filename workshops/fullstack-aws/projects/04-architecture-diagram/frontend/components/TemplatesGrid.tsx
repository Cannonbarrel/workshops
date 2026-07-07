'use client';

import { TEMPLATES } from '@/lib/templates';

interface TemplatesGridProps {
  onSelect: (input: string) => void;
}

export default function TemplatesGrid({ onSelect }: TemplatesGridProps) {
  return (
    <section id="templates" className="bg-zinc-900/40 py-20 border-t border-zinc-800/60">
      <div className="section-container">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700
                          bg-zinc-800/60 text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
            Templates
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Start from a template
          </h2>
          <p className="text-zinc-400 text-lg max-w-lg mx-auto">
            Click any card to load it into the generator. Edit and make it your own.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t.input)}
              className="group flex flex-col items-start gap-3 p-5 rounded-2xl text-left
                         border border-zinc-800 bg-zinc-900/60
                         hover:border-indigo-500/40 hover:bg-indigo-500/5
                         transition-all duration-200"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl
                              group-hover:bg-indigo-500/10 transition-colors duration-150">
                {t.emoji}
              </div>

              {/* Name + description */}
              <div>
                <p className="text-white text-sm font-semibold leading-tight mb-1">{t.name}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{t.description}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-auto">
                {t.tags.map(tag => (
                  <span key={tag}
                    className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 text-[10px] font-medium
                               group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Use arrow */}
              <div className="self-end text-zinc-700 group-hover:text-indigo-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
