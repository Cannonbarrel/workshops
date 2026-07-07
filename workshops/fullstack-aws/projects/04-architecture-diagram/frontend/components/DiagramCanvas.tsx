'use client';

import type { ParsedDiagram, DiagramNode, DiagramEdge } from '@/types';

// ── Node card ─────────────────────────────────────────────────
function NodeCard({ node }: { node: DiagramNode }) {
  return (
    <div
      className="flex-shrink-0 w-36 rounded-xl p-3.5 transition-all duration-200 hover:scale-[1.03]"
      style={{ background: '#1c1c1f', border: `1px solid ${node.style.borderColor}` }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 text-white flex-shrink-0"
        style={{
          background:  node.style.iconBg,
          boxShadow:  `0 4px 14px ${node.style.iconShadow}`,
        }}
      >
        <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={node.iconPath} />
        </svg>
      </div>

      {/* Labels */}
      <p className="text-white text-[12px] font-semibold leading-tight mb-0.5 truncate">
        {node.displayLabel}
      </p>
      <p className="text-zinc-500 text-[11px] leading-tight truncate">{node.sublabel}</p>

      {/* Category pill */}
      <div
        className="mt-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium uppercase tracking-wide"
        style={{ background: `${node.style.dotColor}18`, color: node.style.dotColor }}
      >
        {node.category}
      </div>
    </div>
  );
}

// ── Animated arrow connector ──────────────────────────────────
function ArrowConnector({ edge, dotIndex }: { edge: DiagramEdge; dotIndex: number }) {
  const tdClass = `td-${dotIndex % 8}` as
    'td-0'|'td-1'|'td-2'|'td-3'|'td-4'|'td-5'|'td-6'|'td-7';

  return (
    <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-1.5 w-14">
      {edge.label && (
        <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider leading-none">
          {edge.label}
        </span>
      )}
      <div className="relative w-full h-4 flex items-center">
        {/* Track */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-zinc-700" />
        </div>
        {/* Travelling dot */}
        <div
          className={`absolute w-2 h-2 rounded-full ${tdClass}`}
          style={{ background: '#6366f1', boxShadow: '0 0 6px #6366f1' }}
        />
        {/* Arrow tip */}
        <svg className="absolute right-0 w-2.5 h-2.5 text-zinc-600"
             fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

// ── Single row of nodes ───────────────────────────────────────
function DiagramRow({
  nodes, edges, rowIndex,
}: { nodes: DiagramNode[]; edges: DiagramEdge[]; rowIndex: number }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-center gap-0 min-w-max animate-fade-in">
        {nodes.map((node, ni) => (
          <div key={node.id} className="flex items-center">
            <NodeCard node={node} />
            {ni < nodes.length - 1 && (
              <ArrowConnector
                edge={edges[ni]}
                dotIndex={rowIndex * 8 + ni}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Row separator ─────────────────────────────────────────────
function RowSeparator() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-zinc-800" />
      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

// ── Main canvas ───────────────────────────────────────────────
export default function DiagramCanvas({ diagram }: { diagram: ParsedDiagram }) {
  const hasNodes = diagram.rows.some(r => r.nodes.length > 0);

  if (!hasNodes) {
    return (
      <div className="flex items-center justify-center py-16 text-center">
        <div>
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">No services detected — try a different description.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 sm:p-7">
      {/* Canvas header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-zinc-400 font-medium">
            {diagram.rows.reduce((acc, r) => acc + r.nodes.length, 0)} services
            &nbsp;·&nbsp;
            {diagram.rows.reduce((acc, r) => acc + r.edges.length, 0)} connections
            &nbsp;·&nbsp;
            {diagram.rows.length} {diagram.rows.length === 1 ? 'flow' : 'flows'}
          </span>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3">
          {['compute', 'database', 'api'].map(cat => {
            const colour = cat === 'compute' ? '#a78bfa' : cat === 'database' ? '#34d399' : '#818cf8';
            return (
              <div key={cat} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: colour }} />
                <span className="text-[10px] text-zinc-500 capitalize">{cat}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-4">
        {diagram.rows.map((row, ri) => (
          <div key={ri}>
            {ri > 0 && <RowSeparator />}
            <DiagramRow nodes={row.nodes} edges={row.edges} rowIndex={ri} />
          </div>
        ))}
      </div>

      {/* Footer timestamp */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
        <span className="text-[10px] text-zinc-600 font-mono">
          generated at {new Date(diagram.generatedAt).toLocaleTimeString()}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-[10px] text-zinc-600">Arcflow</span>
        </div>
      </div>
    </div>
  );
}
