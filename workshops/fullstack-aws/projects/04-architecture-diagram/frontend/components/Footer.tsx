export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/60 py-10">
      <div className="section-container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-white font-bold text-sm">Arcflow</span>
            <span className="text-zinc-600 text-xs">Architecture Diagram Generator</span>
          </div>

          <div className="flex items-center gap-5">
            {[
              { label: 'Generator', href: '#generator' },
              { label: 'Templates', href: '#templates' },
              { label: 'How it works', href: '#how' },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span>Runs entirely</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">client-side</span>
            <span>·</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">zero API calls</span>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-zinc-800/50 flex flex-col sm:flex-row
                        items-center justify-between gap-2 text-xs text-zinc-600">
          <p>© {new Date().getFullYear()} Arcflow. Demo project for AWS architecture visualisation.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              30+ services
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              8 templates
            </span>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-zinc-600">
          Built with ❤️ by{' '}
          <a href="https://becloudready.com/" target="_blank" rel="noopener noreferrer"
             className="text-zinc-400 hover:text-white transition-colors font-medium">
            beCloudReady
          </a>
          {' '}· Toronto
        </div>
      </div>
    </footer>
  );
}
