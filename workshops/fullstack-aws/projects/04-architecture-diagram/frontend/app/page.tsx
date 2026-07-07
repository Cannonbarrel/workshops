'use client';

import { useRef } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import GeneratorSection from '@/components/GeneratorSection';
import TemplatesGrid from '@/components/TemplatesGrid';
import HowItWorksSection from '@/components/HowItWorksSection';
import Footer from '@/components/Footer';
import { parseDiagram } from '@/lib/parser';

// TemplatesGrid needs to populate the generator — we pass a cross-component
// handler that scrolls to #generator and fires the diagram.
// The actual state lives inside GeneratorSection; we trigger it via a ref event.

export default function Home() {
  const genRef = useRef<{ loadTemplate: (input: string) => void } | null>(null);

  function scrollToGenerator() {
    document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleTemplateSelect(input: string) {
    // Scroll first, then let GeneratorSection handle it via a custom event
    scrollToGenerator();
    // Dispatch a custom event the GeneratorSection listens to
    window.dispatchEvent(new CustomEvent('arcflow:loadTemplate', { detail: { input } }));
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar onGenerate={scrollToGenerator} />
      <HeroSection onGenerate={scrollToGenerator} />
      <GeneratorSection />
      <TemplatesGrid onSelect={handleTemplateSelect} />
      <HowItWorksSection />
      <Footer />
    </div>
  );
}
