export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/60">
      <div className="section-container py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo + tagline */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <span className="text-white font-bold text-sm">Stash</span>
              <span className="text-zinc-600 text-xs ml-2">URL Bookmark Saver</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Bookmarks', href: '#app' },
            ].map(({ label, href }) => (
              <a key={label} href={href}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                {label}
              </a>
            ))}
          </div>

          {/* Built on */}
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span>Built on</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">AWS</span>
            <span>with</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">Terraform</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800/50 flex flex-col sm:flex-row
                        items-center justify-between gap-3 text-xs text-zinc-600">
          <p>© {new Date().getFullYear()} Stash. Demo project for AWS serverless learning.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Serverless
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Pay-per-request
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
