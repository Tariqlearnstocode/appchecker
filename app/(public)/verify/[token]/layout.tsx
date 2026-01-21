import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Verify Income',
  description: 'Complete your income verification by securely connecting your bank account.',
};

export default function VerifyLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
