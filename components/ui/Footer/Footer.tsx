import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mx-auto max-w-[1920px] px-6 bg-zinc-900 border-t border-zinc-800">
      <div className="flex flex-col items-center justify-between py-8 space-y-4 md:flex-row">
        <div className="flex items-center gap-2 text-zinc-400">
          <Shield className="w-4 h-4" />
          <span className="text-sm">
            &copy; {new Date().getFullYear()} IncomeChecker.com. Powered by Teller.
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-zinc-500">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
