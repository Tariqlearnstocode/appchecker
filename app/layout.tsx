import { Metadata } from 'next';
import Script from 'next/script';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import Footer from '@/components/Footer';
import GlobalNavbar from '@/components/GlobalNavbar';
import { AuthProvider } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/server';
import 'styles/main.css';

const title = 'IncomeChecker.com';
const description = 'Verify applicant income, bank balances, and transaction history securely via Teller.';

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
    title: title,
    description: description,
    url: siteUrl,
    siteName: 'IncomeChecker.com',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'IncomeChecker.com',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: title,
    description: description,
    images: [ogImage],
  },
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    // "Auth session missing" is expected when user is logged out - not a real error
    if (!authError.message?.includes('Auth session missing')) {
      console.error('RootLayout: Auth error:', authError.message, authError);
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
            gtag('config', 'G-Q8V6F4M6LF');
          `}
        </Script>
        <AuthProvider initialUser={user}>
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
