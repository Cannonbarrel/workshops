'use client';

// ── Service node data ─────────────────────────────────────────
const nodes = [
  {
    id: 'browser',
    label: 'Browser',
    sublabel: 'Client',
    badge: 'Next.js SPA',
    description: 'Static React app loaded from S3',
    color: 'from-slate-600 to-slate-700',
    border: 'border-slate-600/50',
    glow: 'shadow-slate-500/20',
    dot: 'bg-slate-400',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 's3',
    label: 'S3 Bucket',
    sublabel: 'Static Hosting',
    badge: 'AWS S3',
    description: 'Serves HTML/CSS/JS. No server.',
    color: 'from-sky-600 to-blue-700',
    border: 'border-sky-600/50',
    glow: 'shadow-sky-500/20',
    dot: 'bg-sky-400',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'apigw',
    label: 'API Gateway',
    sublabel: 'HTTP API v2',
    badge: 'AWS API GW',
    description: 'Routes REST calls. CORS enabled.',
    color: 'from-indigo-600 to-indigo-700',
    border: 'border-indigo-500/50',
    glow: 'shadow-indigo-500/20',
    dot: 'bg-indigo-400',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
  },
  {
    id: 'lambda',
    label: 'Lambda',
    sublabel: 'Node.js 20.x',
    badge: 'AWS Lambda',
    description: 'Serverless handler. Validates, reads, writes.',
    color: 'from-violet-600 to-purple-700',
    border: 'border-violet-500/50',
    glow: 'shadow-violet-500/20',
    dot: 'bg-violet-400',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'dynamo',
    label: 'DynamoDB',
    sublabel: 'PAY_PER_REQUEST',
    badge: 'AWS DynamoDB',
    description: 'Key-value store for bookmarks.',
    color: 'from-emerald-600 to-teal-700',
    border: 'border-emerald-500/50',
    glow: 'shadow-emerald-500/20',
    dot: 'bg-emerald-400',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
];

const arrows = [
  { label: 'HTTPS', sub: 'Static files' },
  { label: 'REST', sub: 'API calls' },
  { label: 'Invoke', sub: 'Proxy' },
  { label: 'SDK v3', sub: 'Read/Write' },
];

const endpoints = [
  { method: 'GET',    path: '/bookmarks',        color: 'text-sky-400 bg-sky-400/10 border-sky-400/20',    desc: 'List all bookmarks' },
  { method: 'POST',   path: '/bookmarks',        color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', desc: 'Save a new bookmark' },
  { method: 'DELETE', path: '/bookmarks/{id}',   color: 'text-red-400 bg-red-400/10 border-red-400/20',    desc: 'Remove a bookmark' },
];

// ── Animated connector arrow ──────────────────────────────────
function Arrow({ label, sub, index = 0 }: { label: string; sub: string; index?: number }) {
  const dotClass = `animate-travel-${index}` as
    'animate-travel-0' | 'animate-travel-1' | 'animate-travel-2' | 'animate-travel-3';

  return (
    <div className="hidden lg:flex flex-col items-center justify-center gap-1.5 flex-shrink-0 px-1">
      <span className="text-[10px] font-semibold text-zinc-400 tracking-wide uppercase">{label}</span>
      <div className="relative w-14 h-5 flex items-center">
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="w-full h-px bg-zinc-700" />
        </div>
        <div className={`absolute w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/60 ${dotClass}`} />
        <svg className="absolute right-0 w-3 h-3 text-zinc-600 -translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <span className="text-[10px] text-zinc-600">{sub}</span>
    </div>
  );
}

// ── Mobile vertical arrow ─────────────────────────────────────
function VerticalArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1 lg:hidden">
      <div className="w-px h-4 bg-zinc-700" />
      <svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ── Service node card ─────────────────────────────────────────
function Node({ node }: { node: typeof nodes[0] }) {
  return (
    <div className={`
      relative flex-1 min-w-0 rounded-xl border ${node.border}
      bg-zinc-900/80 backdrop-blur-sm p-4
      shadow-lg ${node.glow}
      transition-all duration-200 hover:scale-[1.02] hover:border-opacity-100
    `}>
      {/* Icon badge */}
      <div className={`
        w-9 h-9 rounded-lg bg-gradient-to-br ${node.color}
        flex items-center justify-center text-white mb-3 shadow-md
      `}>
        {node.icon}
      </div>

      {/* Labels */}
      <p className="text-white font-semibold text-sm leading-tight mb-0.5">{node.label}</p>
      <p className="text-zinc-500 text-xs mb-2">{node.sublabel}</p>

      {/* Description */}
      <p className="text-zinc-400 text-xs leading-relaxed">{node.description}</p>

      {/* Live dot */}
      <div className="absolute top-3 right-3">
        <span className={`w-1.5 h-1.5 rounded-full ${node.dot} inline-block`} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function ArchitectureSection() {
  return (
    <section className="bg-zinc-950 py-24 border-t border-zinc-800/60">
      <div className="section-container">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                          border border-zinc-700 bg-zinc-800/60
                          text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
            Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            How every request flows
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            End-to-end serverless path — from browser click to DynamoDB and back.
          </p>
        </div>

        {/* ── Main flow diagram ─────────────────────────── */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 mb-6">

          {/* Desktop: horizontal / Mobile: vertical */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-0">
            {nodes.map((node, i) => (
              <div key={node.id} className="flex flex-col lg:flex-row items-center flex-1 min-w-0">
                <Node node={node} />
                {i < nodes.length - 1 && (
                  <>
                    <Arrow label={arrows[i].label} sub={arrows[i].sub} index={i} />
                    <VerticalArrow label={arrows[i].label} />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* CloudWatch branch */}
          <div className="mt-6 pt-6 border-t border-zinc-800/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Branch indicator */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className="w-px h-4 bg-zinc-700" />
                  <svg className="w-3 h-3 text-zinc-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Lambda logs to</span>
              </div>

              {/* CloudWatch card */}
              <div className="flex items-center gap-3 rounded-xl border border-orange-500/20
                              bg-orange-500/5 px-4 py-3 w-full sm:w-auto">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600
                                flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">CloudWatch</p>
                  <p className="text-zinc-500 text-xs">Structured JSON logs · 6-widget dashboard · 14-day retention</p>
                </div>
              </div>

              {/* Terraform badge */}
              <div className="sm:ml-auto flex items-center gap-3 rounded-xl border border-violet-500/20
                              bg-violet-500/5 px-4 py-3 w-full sm:w-auto">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600
                                flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Terraform IaC</p>
                  <p className="text-zinc-500 text-xs">Provisions all 8 AWS resources · 1 command deploy + destroy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── API endpoints ─────────────────────────────── */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 mb-6">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
            API Endpoints
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {endpoints.map((ep) => (
              <div key={`${ep.method}-${ep.path}`}
                   className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className={`
                  flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border ${ep.color}
                  uppercase tracking-wide font-mono
                `}>
                  {ep.method}
                </span>
                <div className="min-w-0">
                  <code className="text-xs text-zinc-300 font-mono block truncate">{ep.path}</code>
                  <span className="text-xs text-zinc-500">{ep.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Data shape ────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Request */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">POST body</p>
            </div>
            <pre className="text-xs text-zinc-300 font-mono leading-relaxed">{`{
  "title": "Terraform Docs",
  "url":   "https://developer.hashicorp.com"
}`}</pre>
          </div>

          {/* Stored record */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">DynamoDB record</p>
            </div>
            <pre className="text-xs text-zinc-300 font-mono leading-relaxed">{`{
  "id":        "550e8400-e29b...",
  "title":     "Terraform Docs",
  "url":       "https://developer.hashicorp.com",
  "createdAt": "2024-01-15T10:30:00.000Z"
}`}</pre>
          </div>

        </div>

      </div>
    </section>
  );
}
