import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import ReportContent from './ReportContent';

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

  if (verification.status !== 'completed' || !verification.report_data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Report Not Ready</h1>
          <p className="text-zinc-400">
            The applicant hasn't completed their verification yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ReportContent
      verification={verification}
      reportData={verification.report_data}
    />
  );
}

