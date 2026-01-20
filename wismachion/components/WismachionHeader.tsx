import { Button } from '../../components/ui/button';
import { User, LogOut, Home, Settings } from 'lucide-react';

interface WismachionHeaderProps {
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  onPortal: () => void;
  onHome: () => void;
}

export function WismachionHeader({ user, onLogin, onLogout, onPortal, onHome }: WismachionHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b-2 border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onHome}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">PC</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PerfectComm</h1>
              <p className="text-xs text-gray-600">RS-232 Communication Software</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Features
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Pricing
            </a>
            <a href="#download" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Download
            </a>
            <a href="#support" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Support
            </a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button variant="outline" onClick={onPortal} className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                  <Settings className="w-4 h-4" />
                  My Licenses
                </Button>
                <Button variant="ghost" onClick={onLogout} className="gap-2 text-gray-700 hover:bg-gray-100">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={onLogin} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                <User className="w-4 h-4" />
                Customer Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}