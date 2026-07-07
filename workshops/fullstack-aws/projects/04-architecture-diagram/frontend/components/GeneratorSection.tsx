'use client';

import { useState, useRef, useEffect } from 'react';
import { parseDiagram } from '@/lib/parser';
import { TEMPLATES } from '@/lib/templates';
import DiagramCanvas from './DiagramCanvas';
import type { ParsedDiagram } from '@/types';

const PLACEHOLDER = `Describe your architecture or use arrow notation:

Browser → API Gateway → Lambda → DynamoDB
Lambda → CloudWatch

Try: "serverless app with auth" or paste any flow.`;

export default function GeneratorSection() {
  const [input, setInput]       = useState('');
  const [diagram, setDiagram]   = useState<ParsedDiagram | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied]     = useState(false);
  const canvasRef               = useRef<HTMLDivElement>(null);

  function generate(text?: string) {
    const src = (text ?? input).trim();
    if (!src) return;
    setGenerating(true);
    // Small delay for perceived generation effect
    setTimeout(() => {
      setDiagram(parseDiagram(src));
      setGenerating(false);
      setTimeout(() => {
        canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }, 300);
  }

  function loadTemplate(t: typeof TEMPLATES[0]) {
    setInput(t.input);
    generate(t.input);
  }

  async function copyInput() {
    await navigator.clipboard.writeText(input).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    function handle(e: Event) {
      const { input: tmpl } = (e as CustomEvent<{ input: string }>).detail;
      setInput(tmpl);
      generate(tmpl);
    }
    window.addEventListener('arcflow:loadTemplate', handle);
    return () => window.removeEventListener('arcflow:loadTemplate', handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const charCount = input.length;

  return (
    <section id="generator" className="bg-zinc-950 py-20 border-t border-zinc-800/60">
      <div className="section-container">

        {/* Section header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700
                          bg-zinc-800/60 text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
            Generator
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Describe your system
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Use arrow notation or plain English. Arcflow recognises 30+ AWS and generic services.
          </p>
        </div>

        {/* Quick templates */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {TEMPLATES.slice(0, 5).map(t => (
            <button
              key={t.id}
              onClick={() => loadTemplate(t)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         border border-zinc-800 bg-zinc-900/60 text-zinc-400
                         hover:border-indigo-500/50 hover:text-indigo-300 hover:bg-indigo-500/5
                         transition-all duration-150"
            >
              <span>{t.emoji}</span>
              {t.name}
            </button>
          ))}
          <button
            onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                       border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            View all →
          </button>
        </div>

        {/* Input card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden mb-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-xs text-zinc-600 ml-1">architecture.flow</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 font-mono">{charCount} chars</span>
              {input && (
                <button onClick={copyInput}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              )}
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') generate();
            }}
            placeholder={PLACEHOLDER}
            rows={7}
            className="w-full bg-transparent px-5 py-4 text-sm text-zinc-300 placeholder-zinc-700
                       font-mono leading-relaxed resize-none focus:outline-none"
          />

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-900/80">
            <span className="text-[11px] text-zinc-600">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono text-[10px]">⌘ Enter</kbd>
              &nbsp; to generate
            </span>
            <button
              onClick={() => generate()}
              disabled={!input.trim() || generating}
              className="btn-primary px-6 py-2"
            >
              {generating ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  Generate
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Syntax help */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Arrow notation', example: 'A → B → C → D' },
            { label: 'Multiple flows', example: 'A → B → C\nD → E → F' },
            { label: 'Pipe separator', example: 'A → B → C | D → E' },
          ].map(({ label, example }) => (
            <div key={label} className="px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">{label}</p>
              <code className="text-xs text-indigo-400 font-mono whitespace-pre">{example}</code>
            </div>
          ))}
        </div>

        {/* Diagram output */}
        <div ref={canvasRef}>
          {generating && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
              <svg className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <p className="text-zinc-500 text-sm">Parsing your architecture…</p>
            </div>
          )}
          {!generating && diagram && <DiagramCanvas diagram={diagram} />}
          {!generating && !diagram && (
            <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <p className="text-zinc-500 text-sm mb-1">Your diagram will appear here</p>
              <p className="text-zinc-700 text-xs">Pick a template above or type a flow description</p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
