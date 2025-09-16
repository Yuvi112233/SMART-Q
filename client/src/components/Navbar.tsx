import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Clock, Bell, User, LogOut, Settings } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm hidden md:block">
        <div className="px-4 py-3">
          <div className="flex items-center justify-end md:justify-between">
            {/* Logo */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent md:text-2xl">
                  SmartQ
                </span>
              </Link>
            </div>

            {/* Mobile Right Section */}
            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  {/* Mobile Notifications */}
                  <button 
                    className="relative p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                    data-testid="button-notifications"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                </>
              ) : (
                <div className="hidden md:block">
                  <Link href="/auth" data-testid="link-auth">
                    <Button 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-4 py-2 text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      data-testid="button-signin"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Navigation - Hidden on Mobile */}
        <div className="hidden md:block border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-4">
              {/* Desktop Navigation */}
              <nav className="flex items-center space-x-1">
                <Link 
                  href="/" 
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    location === '/' 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                  data-testid="link-discover"
                >
                  Discover
                </Link>
                {user && (
                  <>
                    <Link 
                      href="/queue" 
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 relative ${
                        location === '/queue' 
                          ? 'text-purple-600 bg-purple-50' 
                          : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                      data-testid="link-queue"
                    >
                      My Queue
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </Link>
                    {user.role === 'salon_owner' && (
                      <Link 
                        href="/dashboard" 
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          location === '/dashboard' 
                            ? 'text-purple-600 bg-purple-50' 
                            : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                        }`}
                        data-testid="link-dashboard"
                      >
                        Dashboard
                      </Link>
                    )}
                  </>
                )}
              </nav>

              {/* Desktop User Section (Simplified) */}
              {user && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600" data-testid="text-username">
                    Welcome, {user.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-40 md:hidden">
          <nav className="flex justify-around">
            <Link 
              href="/" 
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                location === '/' ? 'text-purple-600 bg-purple-50' : 'text-gray-600'
              }`}
            >
              <Clock className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Discover</span>
            </Link>

            <Link 
              href="/queue" 
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative ${
                location === '/queue' ? 'text-purple-600 bg-purple-50' : 'text-gray-600'
              }`}
            >
              <Bell className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Queue</span>
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            {user.role === 'salon_owner' && (
              <Link 
                href="/dashboard" 
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  location === '/dashboard' ? 'text-purple-600 bg-purple-50' : 'text-gray-600'
                }`}
              >
                <Settings className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Dashboard</span>
              </Link>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="flex flex-col items-center py-2 px-3 rounded-lg text-gray-600"
                >
                  <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-medium mb-1">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-medium">Profile</span>
                </button>
              </SheetTrigger>
              <SheetContent>
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-medium">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role?.replace('_', ' ') || 'Customer'}</p>
                    </div>
                  </div>
                </div>
                
                <Link 
                  href="/profile" 
                  className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>
                
                <Link 
                  href="/settings" 
                  className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
                
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={() => {
                      logout();
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </nav>
        </div>
      )}
    </>
  );
}
