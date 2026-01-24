import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReportContent from './ReportContent';
import { calculateIncomeReport } from '@/lib/income-calculations';
import { logAudit } from '@/lib/audit';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();
  
  const { data: verification } = await supabase
    .from('income_verifications')
    .select('individual_name, status')
    .eq('verification_token', token)
    .single() as { data: any | null };
  
  if (verification) {
    return {
      title: `Report - ${verification.individual_name}`,
      description: `Income verification report for ${verification.individual_name}`,
    };
  }
  
  return {
    title: 'Report',
    description: 'Income verification report',
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Fetch verification by token
  const { data: verification, error } = await supabase
    .from('income_verifications')
    .select('*')
    .eq('verification_token', token)
    .single() as { data: any; error: any };

  if (error || !verification) {
    // Either doesn't exist or user doesn't own it
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-9V5a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to view this report.
          </p>
          <Link 
            href="/"
            className="inline-block px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if we have data in raw_plaid_data
  const rawData = verification.raw_plaid_data as any;

  if (verification.status !== 'completed' || !rawData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Report Not Ready</h1>
          <p className="text-gray-600">
            The individual hasn't completed their verification yet.
          </p>
        </div>
      </div>
    );
  }

  // Log the report view for audit trail
  await logAudit({
    action: 'view',
    resourceType: 'report',
    resourceId: token,
    metadata: {
      verification_id: verification.id,
      individual_name: verification.individual_name,
    },
  });

  // Calculate report from raw data (or use legacy data for old verifications)
  let reportData;
  if (rawData) {
    // New format: calculate from raw Plaid data
    reportData = calculateIncomeReport(rawData);
  } else {
    // Legacy format: use pre-calculated data (for backwards compatibility)
    reportData = legacyData;
  }

  return (
    <ReportContent
      verification={verification}
      reportData={reportData}
      isCalculated={!!rawData}
    />
  );
}
