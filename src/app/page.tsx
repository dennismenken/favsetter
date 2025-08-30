'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/favorites');
        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.push('/dashboard');
        }
      } catch {
        // User is not authenticated, stay on landing page
        console.log('User not authenticated');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-red-500 mr-3" />
              <h1 className="text-5xl font-bold text-gray-900">FavSetter</h1>
            </div>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Organize your favorite links with ease. Save, rate, and automatically group your bookmarks by domain.
            </p>
            <Button 
              size="lg" 
              onClick={() => router.push('/login')}
              className="text-lg px-8 py-3"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Save Favorites</h3>
              <p className="text-gray-600">
                Easily save your favorite URLs with automatic metadata fetching for titles and descriptions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Heart key={star} className="w-3 h-3 text-green-600 fill-current" />
                  ))}
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Rate & Review</h3>
              <p className="text-gray-600">
                Rate your favorites with a 5-star system to keep track of your most valuable resources.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-purple-600 rounded"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Auto-Grouping</h3>
              <p className="text-gray-600">
                Automatically organize your favorites by domain for better organization and discovery.
              </p>
            </div>
          </div>

          {/* Demo Account Info */}
          <div className="bg-white p-6 rounded-lg shadow-sm border max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-3">Try the Demo</h3>
            <p className="text-gray-600 mb-4">
              Experience FavSetter with our demo account:
            </p>
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
              <strong>Email:</strong> demo@example.com<br />
              <strong>Password:</strong> password123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
