'use client';

import { useState, useEffect } from 'react';

interface NavbarProps {
  onGetStarted: () => void;
}

export default function Navbar({ onGetStarted }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <nav className={`
      fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${scrolled
        ? 'bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 shadow-xl shadow-black/20'
        : 'bg-transparent border-b border-transparent'}
    `}>
      <div className="section-container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Stash</span>
          </a>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Bookmarks', href: '#app' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="px-3.5 py-2 rounded-lg text-sm text-zinc-400 hover:text-white
                           hover:bg-zinc-800/60 transition-all duration-150"
              >
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <button onClick={onGetStarted} className="btn-primary-dark text-sm px-4 py-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Save a Link
          </button>
        </div>
      </div>
    </nav>
  );
}
