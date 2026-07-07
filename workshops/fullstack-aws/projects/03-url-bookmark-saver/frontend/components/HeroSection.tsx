'use client';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative bg-zinc-950 overflow-hidden pt-32 pb-28">
      {/* Background effects */}
      <div className="hero-orb animate-glow-pulse" />
      <div className="hero-grid absolute inset-0" />

      {/* Gradient edge fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />

      <div className="section-container relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                          border border-indigo-500/30 bg-indigo-500/10 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-medium text-indigo-300 tracking-wide">
              Serverless · AWS Lambda · DynamoDB
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6">
            Save every link
            <br />
            <span className="gradient-text">that matters.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl mb-10">
            A cloud-native bookmark manager built on AWS.&nbsp;
            <span className="text-zinc-300">Zero friction. Always available.</span>
            &nbsp;Save a URL in seconds, access it from anywhere.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
            <button
              onClick={onGetStarted}
              className="btn-primary-dark text-base px-7 py-3 rounded-xl"
            >
              Start saving
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <a
              href="#features"
              className="btn-ghost-dark text-base px-7 py-3 rounded-xl"
            >
              Explore features
            </a>
          </div>

          {/* Tech trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { label: 'AWS Lambda', icon: '⚡' },
              { label: 'DynamoDB', icon: '🗄️' },
              { label: 'API Gateway', icon: '🔗' },
              { label: 'Terraform IaC', icon: '🏗️' },
              { label: 'Next.js', icon: '▲' },
            ].map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
                <span className="text-sm">{icon}</span>
                <span className="text-xs font-medium tracking-wide">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
