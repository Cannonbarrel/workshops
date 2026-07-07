import type { NodeDef } from '@/types';

// ── SVG path snippets (Heroicons outline) ─────────────────────
const P = {
  monitor:   'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  phone:     'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  lightning: 'M13 10V3L4 14h7v7l9-11h-7z',
  globe:     'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  database:  'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
  folder:    'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z',
  shield:    'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  chart:     'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  queue:     'M4 6h16M4 10h16M4 14h16M4 18h16',
  code:      'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  server:    'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
  cloud:     'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
  box:       'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  brain:     'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  switch:    'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  bell:      'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  hammer:    'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  lock:      'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  email:     'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  cdn:       'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
};

// ── Node registry ─────────────────────────────────────────────
export const NODE_REGISTRY: Record<string, NodeDef> = {

  // ── Clients ──────────────────────────────────────────────────
  browser: {
    label: 'Browser', sublabel: 'Web Client', category: 'client',
    style: { iconBg: 'linear-gradient(135deg,#475569,#334155)', iconShadow: 'rgba(71,85,105,0.4)', borderColor: '#47556940', dotColor: '#94a3b8' },
    iconPath: P.monitor, keywords: ['browser', 'web', 'client', 'user', 'frontend client'],
  },
  mobile: {
    label: 'Mobile App', sublabel: 'iOS / Android', category: 'client',
    style: { iconBg: 'linear-gradient(135deg,#475569,#334155)', iconShadow: 'rgba(71,85,105,0.4)', borderColor: '#47556940', dotColor: '#94a3b8' },
    iconPath: P.phone, keywords: ['mobile', 'ios', 'android', 'app', 'phone'],
  },

  // ── CDN / Network ────────────────────────────────────────────
  cloudfront: {
    label: 'CloudFront', sublabel: 'CDN', category: 'cdn',
    style: { iconBg: 'linear-gradient(135deg,#0ea5e9,#0369a1)', iconShadow: 'rgba(14,165,233,0.4)', borderColor: '#0ea5e940', dotColor: '#38bdf8' },
    iconPath: P.cdn, keywords: ['cloudfront', 'cdn', 'edge', 'distribution'],
  },
  alb: {
    label: 'ALB', sublabel: 'Load Balancer', category: 'cdn',
    style: { iconBg: 'linear-gradient(135deg,#06b6d4,#0e7490)', iconShadow: 'rgba(6,182,212,0.4)', borderColor: '#06b6d440', dotColor: '#22d3ee' },
    iconPath: P.switch, keywords: ['alb', 'load balancer', 'elb', 'nlb', 'balancer'],
  },

  // ── Storage / Hosting ────────────────────────────────────────
  s3: {
    label: 'S3', sublabel: 'Object Storage', category: 'storage',
    style: { iconBg: 'linear-gradient(135deg,#2563eb,#1d4ed8)', iconShadow: 'rgba(37,99,235,0.4)', borderColor: '#2563eb40', dotColor: '#60a5fa' },
    iconPath: P.folder, keywords: ['s3', 'bucket', 'object storage', 'static'],
  },
  efs: {
    label: 'EFS', sublabel: 'File Storage', category: 'storage',
    style: { iconBg: 'linear-gradient(135deg,#2563eb,#1d4ed8)', iconShadow: 'rgba(37,99,235,0.4)', borderColor: '#2563eb40', dotColor: '#60a5fa' },
    iconPath: P.folder, keywords: ['efs', 'file system', 'nfs'],
  },

  // ── API ───────────────────────────────────────────────────────
  'api gateway': {
    label: 'API Gateway', sublabel: 'HTTP API v2', category: 'api',
    style: { iconBg: 'linear-gradient(135deg,#4f46e5,#4338ca)', iconShadow: 'rgba(79,70,229,0.4)', borderColor: '#4f46e540', dotColor: '#818cf8' },
    iconPath: P.globe, keywords: ['api gateway', 'apigw', 'api gw', 'rest api', 'http api', 'gateway'],
  },

  // ── Compute ───────────────────────────────────────────────────
  lambda: {
    label: 'Lambda', sublabel: 'Node.js 20.x', category: 'compute',
    style: { iconBg: 'linear-gradient(135deg,#7c3aed,#6d28d9)', iconShadow: 'rgba(124,58,237,0.4)', borderColor: '#7c3aed40', dotColor: '#a78bfa' },
    iconPath: P.lightning, keywords: ['lambda', 'function', 'serverless', 'fn', 'handler'],
  },
  ec2: {
    label: 'EC2', sublabel: 'Virtual Machine', category: 'compute',
    style: { iconBg: 'linear-gradient(135deg,#ea580c,#c2410c)', iconShadow: 'rgba(234,88,12,0.4)', borderColor: '#ea580c40', dotColor: '#fb923c' },
    iconPath: P.server, keywords: ['ec2', 'virtual machine', 'vm', 'instance', 'server'],
  },
  ecs: {
    label: 'ECS', sublabel: 'Containers', category: 'compute',
    style: { iconBg: 'linear-gradient(135deg,#ea580c,#c2410c)', iconShadow: 'rgba(234,88,12,0.4)', borderColor: '#ea580c40', dotColor: '#fb923c' },
    iconPath: P.box, keywords: ['ecs', 'container', 'docker', 'fargate', 'task'],
  },
  eks: {
    label: 'EKS', sublabel: 'Kubernetes', category: 'compute',
    style: { iconBg: 'linear-gradient(135deg,#ea580c,#c2410c)', iconShadow: 'rgba(234,88,12,0.4)', borderColor: '#ea580c40', dotColor: '#fb923c' },
    iconPath: P.box, keywords: ['eks', 'kubernetes', 'k8s', 'cluster'],
  },

  // ── Databases ─────────────────────────────────────────────────
  dynamodb: {
    label: 'DynamoDB', sublabel: 'NoSQL Database', category: 'database',
    style: { iconBg: 'linear-gradient(135deg,#059669,#047857)', iconShadow: 'rgba(5,150,105,0.4)', borderColor: '#05966940', dotColor: '#34d399' },
    iconPath: P.database, keywords: ['dynamodb', 'dynamo', 'nosql', 'ddb'],
  },
  rds: {
    label: 'RDS', sublabel: 'SQL Database', category: 'database',
    style: { iconBg: 'linear-gradient(135deg,#0d9488,#0f766e)', iconShadow: 'rgba(13,148,136,0.4)', borderColor: '#0d948840', dotColor: '#2dd4bf' },
    iconPath: P.database, keywords: ['rds', 'sql', 'mysql', 'postgres', 'postgresql', 'aurora', 'relational'],
  },
  aurora: {
    label: 'Aurora', sublabel: 'Managed SQL', category: 'database',
    style: { iconBg: 'linear-gradient(135deg,#0d9488,#0f766e)', iconShadow: 'rgba(13,148,136,0.4)', borderColor: '#0d948840', dotColor: '#2dd4bf' },
    iconPath: P.database, keywords: ['aurora', 'aurora mysql', 'aurora postgres'],
  },

  // ── Cache ─────────────────────────────────────────────────────
  elasticache: {
    label: 'ElastiCache', sublabel: 'Redis Cache', category: 'cache',
    style: { iconBg: 'linear-gradient(135deg,#dc2626,#b91c1c)', iconShadow: 'rgba(220,38,38,0.4)', borderColor: '#dc262640', dotColor: '#f87171' },
    iconPath: P.lightning, keywords: ['elasticache', 'redis', 'memcached', 'cache'],
  },

  // ── Queues / Events ───────────────────────────────────────────
  sqs: {
    label: 'SQS', sublabel: 'Message Queue', category: 'queue',
    style: { iconBg: 'linear-gradient(135deg,#d97706,#b45309)', iconShadow: 'rgba(217,119,6,0.4)', borderColor: '#d9770640', dotColor: '#fbbf24' },
    iconPath: P.queue, keywords: ['sqs', 'queue', 'message queue', 'fifo'],
  },
  sns: {
    label: 'SNS', sublabel: 'Pub / Sub', category: 'queue',
    style: { iconBg: 'linear-gradient(135deg,#d97706,#b45309)', iconShadow: 'rgba(217,119,6,0.4)', borderColor: '#d9770640', dotColor: '#fbbf24' },
    iconPath: P.bell, keywords: ['sns', 'notification', 'pub sub', 'topic'],
  },
  eventbridge: {
    label: 'EventBridge', sublabel: 'Event Bus', category: 'queue',
    style: { iconBg: 'linear-gradient(135deg,#d97706,#b45309)', iconShadow: 'rgba(217,119,6,0.4)', borderColor: '#d9770640', dotColor: '#fbbf24' },
    iconPath: P.lightning, keywords: ['eventbridge', 'event bus', 'events', 'event-driven'],
  },
  kinesis: {
    label: 'Kinesis', sublabel: 'Data Streams', category: 'queue',
    style: { iconBg: 'linear-gradient(135deg,#d97706,#b45309)', iconShadow: 'rgba(217,119,6,0.4)', borderColor: '#d9770640', dotColor: '#fbbf24' },
    iconPath: P.queue, keywords: ['kinesis', 'stream', 'streaming', 'data stream'],
  },

  // ── Auth ──────────────────────────────────────────────────────
  cognito: {
    label: 'Cognito', sublabel: 'Auth / Identity', category: 'auth',
    style: { iconBg: 'linear-gradient(135deg,#db2777,#be185d)', iconShadow: 'rgba(219,39,119,0.4)', borderColor: '#db277740', dotColor: '#f472b6' },
    iconPath: P.shield, keywords: ['cognito', 'auth', 'authentication', 'identity', 'login', 'oauth', 'jwt'],
  },

  // ── Monitoring ────────────────────────────────────────────────
  cloudwatch: {
    label: 'CloudWatch', sublabel: 'Monitoring', category: 'monitoring',
    style: { iconBg: 'linear-gradient(135deg,#ea580c,#c2410c)', iconShadow: 'rgba(234,88,12,0.4)', borderColor: '#ea580c40', dotColor: '#fb923c' },
    iconPath: P.chart, keywords: ['cloudwatch', 'monitoring', 'logs', 'metrics', 'observability', 'dashboard'],
  },

  // ── AI / ML ───────────────────────────────────────────────────
  bedrock: {
    label: 'Bedrock', sublabel: 'Foundation Models', category: 'ai',
    style: { iconBg: 'linear-gradient(135deg,#7c3aed,#4c1d95)', iconShadow: 'rgba(124,58,237,0.4)', borderColor: '#7c3aed40', dotColor: '#c4b5fd' },
    iconPath: P.brain, keywords: ['bedrock', 'claude', 'llm', 'foundation model', 'generative ai', 'ai'],
  },
  sagemaker: {
    label: 'SageMaker', sublabel: 'ML Platform', category: 'ai',
    style: { iconBg: 'linear-gradient(135deg,#7c3aed,#4c1d95)', iconShadow: 'rgba(124,58,237,0.4)', borderColor: '#7c3aed40', dotColor: '#c4b5fd' },
    iconPath: P.brain, keywords: ['sagemaker', 'machine learning', 'ml', 'model training'],
  },

  // ── DevOps ────────────────────────────────────────────────────
  github: {
    label: 'GitHub', sublabel: 'Source Control', category: 'devops',
    style: { iconBg: 'linear-gradient(135deg,#374151,#1f2937)', iconShadow: 'rgba(55,65,81,0.4)', borderColor: '#37415140', dotColor: '#9ca3af' },
    iconPath: P.code, keywords: ['github', 'gitlab', 'git', 'repo', 'source control', 'vcs'],
  },
  codepipeline: {
    label: 'CodePipeline', sublabel: 'CI/CD', category: 'devops',
    style: { iconBg: 'linear-gradient(135deg,#e11d48,#be123c)', iconShadow: 'rgba(225,29,72,0.4)', borderColor: '#e11d4840', dotColor: '#fb7185' },
    iconPath: P.switch, keywords: ['codepipeline', 'pipeline', 'ci/cd', 'cicd', 'continuous'],
  },
  codebuild: {
    label: 'CodeBuild', sublabel: 'Build Service', category: 'devops',
    style: { iconBg: 'linear-gradient(135deg,#e11d48,#be123c)', iconShadow: 'rgba(225,29,72,0.4)', borderColor: '#e11d4840', dotColor: '#fb7185' },
    iconPath: P.hammer, keywords: ['codebuild', 'build', 'compile', 'test runner'],
  },
  ecr: {
    label: 'ECR', sublabel: 'Container Registry', category: 'devops',
    style: { iconBg: 'linear-gradient(135deg,#e11d48,#be123c)', iconShadow: 'rgba(225,29,72,0.4)', borderColor: '#e11d4840', dotColor: '#fb7185' },
    iconPath: P.box, keywords: ['ecr', 'registry', 'container registry', 'image'],
  },

  // ── Generic ───────────────────────────────────────────────────
  email: {
    label: 'Email', sublabel: 'Notification', category: 'generic',
    style: { iconBg: 'linear-gradient(135deg,#52525b,#3f3f46)', iconShadow: 'rgba(82,82,91,0.4)', borderColor: '#52525b40', dotColor: '#a1a1aa' },
    iconPath: P.email, keywords: ['email', 'ses', 'smtp', 'mail', 'notification'],
  },
  user: {
    label: 'User', sublabel: 'End User', category: 'client',
    style: { iconBg: 'linear-gradient(135deg,#475569,#334155)', iconShadow: 'rgba(71,85,105,0.4)', borderColor: '#47556940', dotColor: '#94a3b8' },
    iconPath: P.monitor, keywords: ['user', 'end user', 'person', 'human'],
  },
};

// ── Ordered lookup (longest keywords first to avoid partial clobbers) ─────────
const SORTED_KEYS = Object.keys(NODE_REGISTRY).sort(
  (a, b) => NODE_REGISTRY[b].keywords[0].length - NODE_REGISTRY[a].keywords[0].length
);

export function lookupNode(name: string): NodeDef | null {
  const lower = name.toLowerCase().trim();

  // 1. Exact registry key
  if (NODE_REGISTRY[lower]) return NODE_REGISTRY[lower];

  // 2. Keyword scan (longest-keyword-first so "api gateway" beats "api")
  for (const key of SORTED_KEYS) {
    const def = NODE_REGISTRY[key];
    for (const kw of def.keywords) {
      if (lower.includes(kw.toLowerCase()) || kw.toLowerCase().includes(lower)) {
        return def;
      }
    }
  }

  return null;
}
