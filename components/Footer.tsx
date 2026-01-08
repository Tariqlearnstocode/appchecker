import Link from 'next/link';
import { FileCheck } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-500">
              © {currentYear}, Income Verifier
            </span>
          </div>
          
          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/security" className="text-gray-500 hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/disclaimers" className="text-gray-500 hover:text-gray-900 transition-colors">
              Terms of Use
            </Link>
            <Link href="/security" className="text-gray-500 hover:text-gray-900 transition-colors">
              Security
            </Link>
            <Link href="/disclaimers" className="text-gray-500 hover:text-gray-900 transition-colors">
              Disclaimers
            </Link>
            <Link href="mailto:support@example.com" className="text-gray-500 hover:text-gray-900 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
        
        {/* Secondary Links */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <Link 
            href="/security#gdpr" 
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Do Not Sell or Share My Personal Information
          </Link>
        </div>
      </div>
    </footer>
  );
}

