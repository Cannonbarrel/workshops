import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Arcflow — Architecture Diagram Generator',
  description: 'Turn any system description into a beautiful animated architecture flow diagram.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
