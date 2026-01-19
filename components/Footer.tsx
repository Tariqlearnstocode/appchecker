import Link from 'next/link';
import { FileCheck } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-emerald-50 border-t border-emerald-100 mt-auto print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-500">
              © {currentYear}, IncomeChecker.com
            </span>
          </div>
          
          {/* Links - Two Columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Link href="/pricing" className="text-gray-700 hover:text-emerald-700 transition-colors">
              Pricing
            </Link>
            <Link href="/security" className="text-gray-700 hover:text-emerald-700 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/banks" className="text-gray-700 hover:text-emerald-700 transition-colors">
              Supported Banks
            </Link>
            <Link href="/disclaimers" className="text-gray-700 hover:text-emerald-700 transition-colors">
              Terms of Use
            </Link>
            <Link href="/faq" className="text-gray-700 hover:text-emerald-700 transition-colors">
              FAQ
            </Link>
            <Link href="/security" className="text-gray-700 hover:text-emerald-700 transition-colors">
              Security
            </Link>
            <Link href="mailto:info@incomechecker.com" className="text-gray-700 hover:text-emerald-700 transition-colors">
              Contact Us
            </Link>
            <Link href="/disclaimers" className="text-gray-700 hover:text-emerald-700 transition-colors">
              Disclaimers
            </Link>
          </div>
        </div>
        
        {/* Secondary Links */}
        <div className="mt-4 pt-4 border-t border-emerald-100 text-center">
          <Link 
            href="/security#gdpr" 
            className="text-xs text-gray-600 hover:text-emerald-700 transition-colors"
          >
            Do Not Sell or Share My Personal Information
          </Link>
        </div>
      </div>
    </footer>
  );
}

