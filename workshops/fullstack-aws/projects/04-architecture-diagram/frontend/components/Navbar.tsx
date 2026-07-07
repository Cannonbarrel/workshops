'use client';

import { useState, useEffect } from 'react';

interface NavbarProps { onGenerate: () => void; }

export default function Navbar({ onGenerate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${scrolled ? 'bg-zinc-950/92 backdrop-blur-md border-b border-zinc-800/80' : 'bg-transparent border-b border-transparent'}`}>
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Arcflow</span>
          </a>

          {/* Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Generator', href: '#generator' },
              { label: 'Templates', href: '#templates' },
              { label: 'How it works', href: '#how' },
            ].map(({ label, href }) => (
              <a key={label} href={href}
                className="px-3.5 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all duration-150">
                {label}
              </a>
            ))}
          </div>

          <button onClick={onGenerate} className="btn-primary text-sm px-4 py-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Diagram
          </button>
        </div>
      </div>
    </nav>
  );
}
