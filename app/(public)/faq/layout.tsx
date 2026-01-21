import { Metadata } from 'next';
import { getURL } from '@/utils/helpers';
import { PropsWithChildren } from 'react';

const siteUrl = getURL();
const ogImage = `${siteUrl}/opengraph-image.png`;

export const metadata: Metadata = {
  title: 'FAQ - IncomeChecker.com',
  description: 'Frequently asked questions about IncomeChecker.com income verification service. Learn about security, pricing, bank connections, and how the verification process works.',
  openGraph: {
    title: 'FAQ - IncomeChecker.com',
    description: 'Frequently asked questions about IncomeChecker.com income verification service. Learn about security, pricing, bank connections, and how the verification process works.',
    url: `${siteUrl}/faq`,
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
    title: 'FAQ - IncomeChecker.com',
    description: 'Frequently asked questions about IncomeChecker.com income verification service. Learn about security, pricing, bank connections, and how the verification process works.',
    images: [ogImage],
  },
};

export default function FAQLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
