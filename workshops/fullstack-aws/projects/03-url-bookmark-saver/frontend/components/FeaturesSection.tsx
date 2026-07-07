export default function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'bg-indigo-500',
      glow: 'shadow-indigo-500/30',
      title: 'Zero Friction',
      description: 'Paste a URL, add a title, hit save. Your bookmark is in DynamoDB in under 200ms.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
      color: 'bg-violet-500',
      glow: 'shadow-violet-500/30',
      title: 'Cloud Native',
      description: 'Runs serverless on AWS Lambda. No servers to manage, infinite scale, pay-per-request.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: 'bg-blue-500',
      glow: 'shadow-blue-500/30',
      title: 'URL Validated',
      description: 'Both frontend and backend validate every URL. Only valid http/https links are accepted.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-emerald-500',
      glow: 'shadow-emerald-500/30',
      title: 'Full Observability',
      description: 'Structured JSON logs in CloudWatch. 6-widget monitoring dashboard. Every request traced.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'bg-orange-500',
      glow: 'shadow-orange-500/30',
      title: 'Infrastructure as Code',
      description: 'Every AWS resource defined in Terraform. One command to deploy, one to destroy.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      color: 'bg-pink-500',
      glow: 'shadow-pink-500/30',
      title: 'Free Tier Friendly',
      description: 'Lambda + DynamoDB free tier covers thousands of bookmarks per month. Near-zero cost.',
    },
  ];

  return (
    <section id="features" className="bg-white py-24 border-b border-zinc-100">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50
                          border border-indigo-100 text-xs font-semibold text-indigo-600 uppercase
                          tracking-widest mb-4">
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-4">
            Everything you need.<br />
            <span className="gradient-text-warm">Nothing you don&apos;t.</span>
          </h2>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            Simple functionality built on production-grade AWS infrastructure.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl border border-zinc-100 bg-white
                         hover:border-zinc-200 hover:shadow-lg transition-all duration-200"
            >
              <div className={`
                w-10 h-10 rounded-xl ${f.color} text-white flex items-center justify-center
                shadow-lg ${f.glow} mb-4
              `}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-zinc-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
