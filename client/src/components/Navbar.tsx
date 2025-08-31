import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, Bell } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">SmartQ</span>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/" 
                className={`transition-colors duration-200 ${
                  location === '/' ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
                data-testid="link-discover"
              >
                Discover
              </Link>
              {user && (
                <>
                  <Link 
                    href="/queue" 
                    className={`transition-colors duration-200 ${
                      location === '/queue' ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                    }`}
                    data-testid="link-queue"
                  >
                    My Queue
                  </Link>
                  {user.role === 'salon' && (
                    <Link 
                      href="/dashboard" 
                      className={`transition-colors duration-200 ${
                        location === '/dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      }`}
                      data-testid="link-dashboard"
                    >
                      Dashboard
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <button 
                className="hidden md:flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                data-testid="button-notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="w-2 h-2 bg-primary rounded-full"></span>
              </button>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground" data-testid="text-username">
                  {user.name}
                </span>
                <Button 
                  variant="outline" 
                  onClick={logout}
                  data-testid="button-logout"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/auth" data-testid="link-auth">
                <Button data-testid="button-signin">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
