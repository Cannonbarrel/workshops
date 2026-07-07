export default function HowItWorksSection() {
  const steps = [
    {
      n: '01',
      title: 'Describe your system',
      body: 'Use arrow notation like "Browser → API Gateway → Lambda" or just type plain English. Arcflow understands both.',
      code: 'Browser → API Gateway → Lambda → DynamoDB',
    },
    {
      n: '02',
      title: 'Parser builds the graph',
      body: 'The client-side parser recognises 30+ AWS and generic services, infers connection labels, and splits multi-flow inputs into rows.',
      code: '→ 4 nodes, 3 edges, 1 flow',
    },
    {
      n: '03',
      title: 'Animated diagram renders',
      body: 'Each service gets a styled node card with icon, category, and live-travelling dot animations on every connection.',
      code: '✓ Instant · No API calls · No auth',
    },
  ];

  return (
    <section id="how" className="bg-zinc-950 py-20 border-t border-zinc-800/60">
      <div className="section-container">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700
                          bg-zinc-800/60 text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
            How it works
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Three steps to a diagram
          </h2>
          <p className="text-zinc-400 text-lg max-w-lg mx-auto">
            Everything runs in your browser. No server round-trip, no API keys, no auth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map(s => (
            <div key={s.n} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700
                              flex items-center justify-center text-white font-bold text-lg
                              shadow-lg shadow-indigo-500/30 mb-5">
                {s.n}
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{s.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">{s.body}</p>
              <div className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800">
                <code className="text-xs text-indigo-400 font-mono">{s.code}</code>
              </div>
            </div>
          ))}
        </div>

        {/* Supported services strip */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 text-center">
            Recognised services
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              'Browser','Mobile','S3','CloudFront','API Gateway','Lambda','EC2','ECS','EKS','Fargate',
              'DynamoDB','RDS','Aurora','ElastiCache','SQS','SNS','EventBridge','Kinesis',
              'Cognito','CloudWatch','Bedrock','SageMaker','GitHub','CodePipeline','CodeBuild','ECR',
              'ALB','EFS','Email','User',
            ].map(svc => (
              <span key={svc}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-medium
                           border border-zinc-700/50">
                {svc}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
