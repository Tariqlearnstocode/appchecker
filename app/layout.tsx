import { Metadata } from 'next';
import Script from 'next/script';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import Footer from '@/components/Footer';
import GlobalNavbar from '@/components/GlobalNavbar';
import { AuthProvider } from '@/contexts/AuthContext';
import { GoogleOneTap } from '@/components/GoogleOneTap';
import { RefCapture } from '@/components/RefCapture';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import 'styles/main.css';

const title = 'IncomeChecker.com';
const description = 'Verify applicant income, bank balances, and transaction history securely via Plaid.';

const siteUrl = getURL();
const ogImage = `${siteUrl}/opengraph-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: 'IncomeChecker.com | %s',
    default: 'IncomeChecker.com',
  },
  description: description,
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'IncomeChecker.com',
    title: {
      template: 'IncomeChecker.com | %s',
      default: 'IncomeChecker.com',
    },
    description: description,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'IncomeChecker.com',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      template: 'IncomeChecker.com | %s',
      default: 'IncomeChecker.com',
    },
    description: description,
    images: [ogImage],
  },
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const supabase = await createClient();
  let user = null;
  
  try {
    user = await getUser(supabase);
  } catch (authError: any) {
    // Rate limit errors are common in development with HMR - don't log as errors
    if (authError?.code === 'over_request_rate_limit') {
      // Silently handle rate limits - user will be null, which is fine
    } else if (authError?.message && !authError.message.includes('Auth session missing')) {
      console.error('RootLayout: Auth error:', authError.message);
    }
  }

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Q8V6F4M6LF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            var loc = typeof window !== 'undefined' ? window.location : null;
            gtag('config', 'G-Q8V6F4M6LF', loc ? { page_location: loc.href, page_path: loc.pathname + loc.search } : {});
          `}
        </Script>
        <AuthProvider initialUser={user}>
          <Suspense fallback={null}>
            <RefCapture />
          </Suspense>
          <GoogleOneTap />
          <GlobalNavbar />
          <main id="skip" className="flex-1">
            {children}
          </main>
          <Footer />
          <Suspense>
            <Toaster />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
