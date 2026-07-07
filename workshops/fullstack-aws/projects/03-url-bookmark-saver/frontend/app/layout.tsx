import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stash — Cloud Bookmark Manager',
  description: 'Save and organise URLs in the cloud. Serverless on AWS Lambda + DynamoDB.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-white text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
