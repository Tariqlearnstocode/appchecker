import Link from 'next/link';
import { FileCheck } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#fafafa] border-t border-neutral-200/60 mt-auto print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Logo & Copyright */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-neutral-900">IncomeChecker.com</span>
            </div>
            <p className="text-sm text-neutral-500 max-w-xs">
              Bank-verified income reports in minutes. No pay stubs. No employer calls.
            </p>
          </div>

          {/* Links - Three Columns */}
          <div className="grid grid-cols-3 gap-x-12 gap-y-3 text-sm">
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Product</span>
              <Link href="/pricing" className="text-neutral-600 hover:text-neutral-900 transition-colors">
                Pricing
              </Link>
              <Link href="/report/example" className="text-neutral-600 hover:text-neutral-900 transition-colors">
                Example Report
              </Link>
              <Link href="/banks" className="text-neutral-600 hover:text-neutral-900 transition-colors">
                Supported Banks
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Support</span>
              <Link href="/faq" className="text-neutral-600 hover:text-neutral-900 transition-colors">
                FAQ
              </Link>
              <Link href="mailto:info@incomechecker.com" className="text-neutral-600 hover:text-neutral-900 transition-colors">
                Contact Us
              </Link>
              <Link href="/security" className="text-neutral-600 hover:text-neutral-900 transition-colors">
                Security
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Legal</span>
              <Link href="/privacy" className="text-neutral-600 hover:text-neutral-900 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-neutral-600 hover:text-neutral-900 transition-colors">
                Terms of Use
              </Link>
              <Link href="/disclaimers" className="text-neutral-600 hover:text-neutral-900 transition-colors">
                Disclaimers
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-neutral-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-neutral-400">
            © {currentYear} IncomeChecker.com. All rights reserved.
          </span>
          <Link
            href="/privacy"
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Do Not Sell or Share My Personal Information
          </Link>
        </div>
      </div>
    </footer>
  );
}

