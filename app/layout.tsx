import { Metadata } from 'next';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import Footer from '@/components/Footer';
import GlobalNavbar from '@/components/GlobalNavbar';
import { AuthProvider } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/server';
import 'styles/main.css';

const title = 'Income Verification';
const description = 'Verify applicant income, bank balances, and transaction history securely via Plaid.';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: title,
  description: description,
  openGraph: {
    title: title,
    description: description
  }
};

export default async function RootLayout({ children }: PropsWithChildren) {
  console.log('[ServerAuth] RootLayout: Creating Supabase client');
  const supabase = await createClient();
  
  console.log('[ServerAuth] RootLayout: Calling getUser()');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('[ServerAuth] RootLayout: Auth error:', authError.message, authError);
  }
  
  console.log('[ServerAuth] RootLayout: getUser() result - user:', user?.id || 'null', 'email:', user?.email || 'null');

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">
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
