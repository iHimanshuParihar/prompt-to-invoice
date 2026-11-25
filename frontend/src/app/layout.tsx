import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PromptToInvoice - AI-Powered Invoicing for the Modern Small Business',
  description:
    'Turn everyday language into professional, ready-to-send invoices in seconds. Generative AI invoicing platform for freelancers, consultants, and agencies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
