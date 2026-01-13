'use client';

import Link from 'next/link';
import Logo from '@/components/icons/Logo';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import s from './Navbar.module.css';

export default function Navlinks() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="relative flex flex-row justify-between py-4 align-center md:py-6">
      <div className="flex items-center flex-1">
        <Link href="/" className={s.logo} aria-label="Logo">
          <Logo />
        </Link>
        <nav className="ml-6 space-x-2 lg:block">
          {user && (
            <Link href="/settings" className={s.link}>
              Settings
            </Link>
          )}
        </nav>
      </div>
      <div className="flex justify-end space-x-8">
        {user ? (
          <button onClick={handleSignOut} className={s.link}>
            Sign out
          </button>
        ) : (
          <Link href="/" className={s.link}>
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
