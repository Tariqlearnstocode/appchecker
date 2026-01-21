import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Sample Report',
  description: 'View a sample income verification report from IncomeChecker.com. See how we calculate and display income data from bank transactions.',
};

export default function ExampleReportLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
