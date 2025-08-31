import { Link } from "wouter";
import { Clock, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">SmartQ</span>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Revolutionizing salon experiences with smart queue management and real-time updates.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                data-testid="link-facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                data-testid="link-twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                data-testid="link-instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                data-testid="link-linkedin"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">For Customers</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  data-testid="link-find-salons"
                >
                  Find Salons
                </Link>
              </li>
              <li>
                <Link 
                  href="/queue" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  data-testid="link-track-queue"
                >
                  Track Queue
                </Link>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  data-testid="link-loyalty"
                >
                  Loyalty Program
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  data-testid="link-reviews"
                >
                  Reviews
                </a>
              </li>
            </ul>
          </div>
          
          {/* Business Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">For Salons</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/auth" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  data-testid="link-join"
                >
                  Join SmartQ
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  data-testid="link-dashboard-footer"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  data-testid="link-analytics"
                >
                  Analytics
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  data-testid="link-pricing"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  data-testid="link-help"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  data-testid="link-contact"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  data-testid="link-privacy"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  data-testid="link-terms"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground">
            © 2024 SmartQ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
