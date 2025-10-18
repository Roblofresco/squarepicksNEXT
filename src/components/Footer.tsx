import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900/95 border-t border-white/10 mt-auto pb-24 sm:pb-6">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Main Content */}
        <div className="flex flex-col items-center space-y-4 text-center">
          {/* Information & Support Link */}
          <Link 
            href="/information-and-support"
            className="text-[#1bb0f2] hover:text-[#108bcc] transition-colors duration-200 font-medium text-sm sm:text-base"
          >
            Information & Support
          </Link>
          
          {/* Bottom Bar */}
          <div className="flex flex-col items-center space-y-2 text-xs sm:text-sm text-slate-400">
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4">
              <span>© 2025 SquarePicks</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-slate-500">Play Responsibly. 21+</span>
            </div>
            <div className="text-slate-500 text-xs">
              Licensed and regulated gaming platform
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
