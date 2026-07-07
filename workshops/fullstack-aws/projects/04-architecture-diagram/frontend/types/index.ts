export type NodeCategory =
  | 'client' | 'cdn' | 'storage' | 'api' | 'compute'
  | 'database' | 'cache' | 'queue' | 'auth' | 'monitoring'
  | 'ai' | 'devops' | 'generic';

export interface NodeStyle {
  iconBg:      string;  // CSS gradient
  iconShadow:  string;  // CSS shadow rgba
  borderColor: string;  // CSS hex/rgba
  dotColor:    string;  // CSS hex
}

export interface NodeDef {
  label:    string;
  sublabel: string;
  category: NodeCategory;
  style:    NodeStyle;
  iconPath: string;  // SVG <path d="...">
  keywords: string[];
}

export interface DiagramNode extends NodeDef {
  id:           string;
  displayLabel: string;
}

export interface DiagramEdge {
  id:    string;
  from:  string;
  to:    string;
  label: string;
}

export interface DiagramRow {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface ParsedDiagram {
  rows:        DiagramRow[];
  inputText:   string;
  generatedAt: string;
}

export interface Template {
  id:          string;
  name:        string;
  description: string;
  emoji:       string;
  input:       string;
  tags:        string[];
}
