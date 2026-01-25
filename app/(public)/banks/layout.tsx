import { Metadata } from 'next';
import { getURL } from '@/utils/helpers';
import { PropsWithChildren } from 'react';

const siteUrl = getURL();
const ogImage = `${siteUrl}/opengraph-image.png`;

export const metadata: Metadata = {
  title: 'Supported Banks',
  description: 'IncomeChecker.com supports connections to over 7,000 U.S. banks and credit unions through our secure banking partner, Plaid. Find your bank and verify income securely.',
};

export default function BanksLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
