import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { PulseLoader } from 'react-spinners';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [currentQuote, setCurrentQuote] = useState('');

  // Array of salon/beauty related quotes
  const quotes = [
    "Beauty begins the moment\nyou decide to be yourself.",
    "Confidence is the best\naccessory you can wear.",
    "Your beauty shines from\nwithin and radiates outward.",
    "Self-care isn't selfish,\nit's essential.",
    "Every day is a chance to\nfeel beautiful and confident.",
    "You are your own kind\nof beautiful.",
    "Embrace your uniqueness,\nit's your superpower.",
    "Beauty is about being\ncomfortable in your own skin.",
    "Take time to make\nyour soul happy.",
    "You deserve to feel\namazing every single day."
  ];

  useEffect(() => {
    // Select a random quote when component mounts
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);
    
    console.log('LoadingScreen mounted, starting timers');
    
    // First screen: Brand splash (3 seconds)
    const timer1 = setTimeout(() => {
      console.log('Switching to screen 1 (quote screen)');
      setCurrentScreen(1);
    }, 3000);

    // Second screen: Loading with message (3 seconds)
    const timer2 = setTimeout(() => {
      console.log('Calling onComplete');
      onComplete();
    }, 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  console.log('LoadingScreen render, currentScreen:', currentScreen);

  if (currentScreen === 0) {
    // First Screen: Brand Splash (Salon-themed)
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center z-50">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-2xl mb-6">
              <Sparkles className="h-10 w-10 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-wide">
              Smart<span className="text-yellow-300">Q</span>
            </h1>
            <p className="text-purple-100 text-sm mt-2 font-medium">
              Smart Queue Management
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Second Screen: Skeleton Loading with Components (Salon-themed)
  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Skeleton Header */}
      <div className="bg-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded-full w-8 animate-pulse"></div>
        </div>
      </div>

      {/* Top Skeleton Content */}
      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Center Content - Quote and Loading */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          {/* Motivational Quote */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-700 leading-relaxed whitespace-pre-line">
              {currentQuote}
            </h2>
          </div>
          
          {/* Small Loading Spinner */}
          <div className="relative">
            <PulseLoader 
              color="#a855f7" 
              size={8} 
              margin={2}
              speedMultiplier={0.8}
            />
          </div>
        </div>
      </div>

      {/* Bottom Skeleton Content */}
      <div className="absolute bottom-20 left-0 right-0 p-4 space-y-4">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Skeleton Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-100 p-4">
        <div className="flex justify-center space-x-8">
          <div className="h-6 bg-gray-200 rounded w-6 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-6 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-6 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-6 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}