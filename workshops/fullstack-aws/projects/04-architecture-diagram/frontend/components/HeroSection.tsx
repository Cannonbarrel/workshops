'use client';

interface HeroProps { onGenerate: () => void; }

export default function HeroSection({ onGenerate }: HeroProps) {
  return (
    <section className="relative bg-zinc-950 overflow-hidden pt-36 pb-24">
      <div className="hero-orb animate-glow-pulse" />
      <div className="hero-grid absolute inset-0" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-zinc-950 to-transparent" />

      <div className="section-container relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/8 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-medium text-indigo-300 tracking-wide">
              30+ AWS & generic services · Arrow notation + freeform text
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.04] mb-6">
            From description<br />
            <span className="gradient-text">to diagram.</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl mb-10">
            Type any architecture—arrow notation or plain English.&nbsp;
            <span className="text-zinc-300">Arcflow instantly renders an animated flow diagram</span>
            &nbsp;you can use in docs, slides, and demos.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-14">
            <button onClick={onGenerate} className="btn-primary text-base px-7 py-3 rounded-xl">
              Generate a diagram
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <a href="#templates" className="btn-ghost text-base px-7 py-3 rounded-xl">
              Browse templates
            </a>
          </div>

          {/* Preview snippet */}
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden text-left">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-zinc-800">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="ml-2 text-[11px] text-zinc-600 font-mono">architecture.flow</span>
            </div>
            <div className="px-5 py-4 space-y-1">
              {[
                { text: 'Browser → API Gateway → Lambda → DynamoDB', color: 'text-indigo-400' },
                { text: 'Lambda → CloudWatch', color: 'text-violet-400' },
              ].map((line, i) => (
                <p key={i} className={`text-sm font-mono ${line.color}`}>{line.text}</p>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
