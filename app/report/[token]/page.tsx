import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import ReportContent from './ReportContent';
import { calculateIncomeReport, RawPlaidData } from '@/lib/income-calculations';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ReportPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: verification, error } = await supabase
    .from('income_verifications')
    .select('*')
    .eq('verification_token', token)
    .single();

  if (error || !verification) {
    notFound();
  }

  // Check if we have data (either new raw_plaid_data or old report_data)
  const rawData = verification.raw_plaid_data as RawPlaidData | null;
  const legacyData = verification.report_data;

  if (verification.status !== 'completed' || (!rawData && !legacyData)) {
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
            The applicant hasn't completed their verification yet.
          </p>
        </div>
      </div>
    );
  }

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
