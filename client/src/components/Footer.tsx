import { Link } from "wouter";
import { Clock, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-foreground">SmartQ</span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
              Revolutionizing salon experiences with smart queue management and real-time updates.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                data-testid="link-facebook"
              >
                <Facebook className="h-4 w-4 sm:h-4 sm:w-4" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                data-testid="link-twitter"
              >
                <Twitter className="h-4 w-4 sm:h-4 sm:w-4" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                data-testid="link-instagram"
              >
                <Instagram className="h-4 w-4 sm:h-4 sm:w-4" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                data-testid="link-linkedin"
              >
                <Linkedin className="h-4 w-4 sm:h-4 sm:w-4" />
              </a>
            </div>
          </div>
          
          {/* Quick Links Container - spans remaining columns */}
          <div className="col-span-1 sm:col-span-2 md:col-span-3">
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-8">
              {/* For Customers */}
              <div>
                <h4 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">For Customers</h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  <li>
                    <Link 
                      href="/" 
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200"
                      data-testid="link-find-salons"
                    >
                      Find Salons
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/queue" 
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200"
                      data-testid="link-track-queue"
                    >
                      Track Queue
                    </Link>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200"
                      data-testid="link-loyalty"
                    >
                      Loyalty Program
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200"
                      data-testid="link-reviews"
                    >
                      Reviews
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* For Salons */}
              <div>
                <h4 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">For Salons</h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  <li>
                    <Link 
                      href="/auth" 
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200"
                      data-testid="link-join"
                    >
                      Join SmartQ
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/dashboard" 
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200"
                      data-testid="link-dashboard-footer"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200"
                      data-testid="link-analytics"
                    >
                      Analytics
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200"
                      data-testid="link-pricing"
                    >
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* Support */}
              <div>
                <h4 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">Support</h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  <li>
                    <a 
                      href="#" 
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200"
                      data-testid="link-help"
                    >
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200"
                      data-testid="link-contact"
                    >
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200"
                      data-testid="link-privacy"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200"
                      data-testid="link-terms"
                    >
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hidden md:block border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 SmartQ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}