'use client';

import { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on client side
  useEffect(() => {
    setMounted(true);

    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

    // Check system preference if no saved theme
    const prefersDark =
      !savedTheme &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // Apply theme to HTML element and localStorage
  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Handle theme changes
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta
            name="description"
            content="Health Equity Australia - Special Interest Group of the Australian Health Economics Society dedicated to advancing health equity research and practice."
          />
          <title>Health Equity Australia</title>
        </head>
        <body className={inter.className}>
          <div role="status" aria-live="polite" className="sr-only">
            Loading...
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Health Equity Australia - Special Interest Group of the Australian Health Economics Society dedicated to advancing health equity research and practice."
        />
        <meta name="theme-color" content="#1B365D" />
        <title>Health Equity Australia</title>
        {/* Preload theme to prevent flash of unstyled content */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <NavBar />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
