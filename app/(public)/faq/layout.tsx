import { Metadata } from 'next';
import { getURL } from '@/utils/helpers';
import { PropsWithChildren } from 'react';

const siteUrl = getURL();
const ogImage = `${siteUrl}/opengraph-image.png`;

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about IncomeChecker.com income verification service. Learn about security, pricing, bank connections, and how the verification process works.',
};

export default function FAQLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
