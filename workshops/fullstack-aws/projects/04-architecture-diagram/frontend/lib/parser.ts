import type { DiagramNode, DiagramEdge, DiagramRow, ParsedDiagram, NodeCategory } from '@/types';
import { NODE_REGISTRY, lookupNode } from './nodeRegistry';

let nodeCounter = 0;
function uid(label: string) {
  return `node-${++nodeCounter}-${label.replace(/\s+/g, '-').toLowerCase().slice(0, 12)}`;
}

// ── Infer edge label from category pair ───────────────────────
function edgeLabel(from: NodeCategory, to: NodeCategory): string {
  if (from === 'client' && to === 'cdn')        return 'HTTPS';
  if (from === 'client' && to === 'api')        return 'REST';
  if (from === 'client' && to === 'storage')    return 'HTTPS';
  if (from === 'cdn'    && to === 'storage')    return 'Origin';
  if (from === 'api'    && to === 'compute')    return 'Invoke';
  if (from === 'compute' && to === 'database')  return 'SDK';
  if (from === 'compute' && to === 'cache')     return 'Redis';
  if (from === 'compute' && to === 'queue')     return 'Publish';
  if (from === 'queue'   && to === 'compute')   return 'Trigger';
  if (from === 'compute' && to === 'monitoring') return 'Logs';
  if (from === 'compute' && to === 'ai')        return 'API';
  if (from === 'auth'    && to === 'api')       return 'Token';
  if (from === 'api'     && to === 'auth')      return 'Verify';
  if (from === 'devops'  && to === 'devops')    return 'Trigger';
  if (to === 'monitoring')                       return 'Logs';
  return '';
}

// ── Build a DiagramNode from a raw name string ────────────────
function buildNode(rawName: string): DiagramNode {
  const name = rawName.trim();
  const def = lookupNode(name);
  if (def) {
    return { ...def, id: uid(def.label), displayLabel: def.label };
  }
  // Generic fallback
  const generic = NODE_REGISTRY['user'] ?? Object.values(NODE_REGISTRY)[0];
  return {
    ...generic,
    label: name,
    sublabel: 'Service',
    id: uid(name),
    displayLabel: name,
    category: 'generic',
  };
}

// ── Parse a single row with arrow separators ──────────────────
function parseArrowRow(rowStr: string): DiagramRow {
  const parts = rowStr.split(/\s*(?:→|->|=>|>)\s*/).map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return { nodes: [], edges: [] };

  const nodes: DiagramNode[] = parts.map(buildNode);
  const edges: DiagramEdge[] = nodes.slice(0, -1).map((n, i) => ({
    id:    `edge-${n.id}-${nodes[i + 1].id}`,
    from:  n.id,
    to:    nodes[i + 1].id,
    label: edgeLabel(n.category, nodes[i + 1].category),
  }));

  return { nodes, edges };
}

// ── Parse freeform text by keyword scanning ───────────────────
function parseFreeformRow(text: string): DiagramRow {
  const lower = text.toLowerCase();

  const hits: Array<{ idx: number; def: typeof NODE_REGISTRY[string] }> = [];

  for (const def of Object.values(NODE_REGISTRY)) {
    for (const kw of def.keywords) {
      const idx = lower.indexOf(kw.toLowerCase());
      if (idx !== -1 && !hits.some(h => Math.abs(h.idx - idx) < 5)) {
        hits.push({ idx, def });
        break;
      }
    }
  }

  hits.sort((a, b) => a.idx - b.idx);

  if (hits.length === 0) {
    const node = buildNode(text.trim());
    return { nodes: [node], edges: [] };
  }

  const nodes: DiagramNode[] = hits.map(h => ({
    ...h.def,
    id: uid(h.def.label),
    displayLabel: h.def.label,
  }));

  const edges: DiagramEdge[] = nodes.slice(0, -1).map((n, i) => ({
    id:    `edge-${n.id}-${nodes[i + 1].id}`,
    from:  n.id,
    to:    nodes[i + 1].id,
    label: edgeLabel(n.category, nodes[i + 1].category),
  }));

  return { nodes, edges };
}

// ── Main export ───────────────────────────────────────────────
export function parseDiagram(input: string): ParsedDiagram {
  nodeCounter = 0; // reset for stable IDs

  // Normalise arrow variants
  const normalised = input
    .replace(/\r\n/g, '\n')
    .replace(/-->/g, '→')
    .replace(/->/g,  '→')
    .replace(/=>/g,  '→');

  // Split into row strings (blank lines or | or explicit newlines)
  const rowStrings = normalised
    .split(/\n|\|/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const rows: DiagramRow[] = rowStrings.map(r =>
    /→/.test(r) ? parseArrowRow(r) : parseFreeformRow(r)
  ).filter(r => r.nodes.length > 0);

  return {
    rows: rows.length > 0 ? rows : [{ nodes: [], edges: [] }],
    inputText:   input,
    generatedAt: new Date().toISOString(),
  };
}
