import { Metadata } from 'next';
import { getURL } from '@/utils/helpers';
import { PropsWithChildren } from 'react';

const siteUrl = getURL();
const ogImage = `${siteUrl}/opengraph-image.png`;

export const metadata: Metadata = {
  title: 'Supported Banks - IncomeChecker.com',
  description: 'IncomeChecker.com supports connections to over 7,000 U.S. banks and credit unions through our secure banking partner, Teller. Find your bank and verify income securely.',
  openGraph: {
    title: 'Supported Banks - IncomeChecker.com',
    description: 'IncomeChecker.com supports connections to over 7,000 U.S. banks and credit unions through our secure banking partner, Teller. Find your bank and verify income securely.',
    url: `${siteUrl}/banks`,
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
    title: 'Supported Banks - IncomeChecker.com',
    description: 'IncomeChecker.com supports connections to over 7,000 U.S. banks and credit unions through our secure banking partner, Teller. Find your bank and verify income securely.',
    images: [ogImage],
  },
};

export default function BanksLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
