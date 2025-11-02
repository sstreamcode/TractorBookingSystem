import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, Clock, Tractor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import TractorCard from '@/components/TractorCard';
import { useEffect, useState } from 'react';
import { getTractorsForUI } from '@/lib/api';
import type { Tractor as TractorType } from '@/types';

const Index = () => {
  const [featuredTractors, setFeaturedTractors] = useState<TractorType[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const all = await getTractorsForUI();
        setFeaturedTractors(all.filter(t => t.available).slice(0, 3));
      } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section - Clean and Simple */}
      <section className="relative py-16 md:py-24 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-primary/10 rounded-full">
              <span className="text-sm font-medium text-primary">🚜 Nepal's Leading Tractor Rental Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900">
              Rent Quality Tractors for Your Farm
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Access modern agricultural equipment on-demand. Simple booking, transparent pricing, reliable service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/tractors">
                <Button size="lg" className="text-base px-8">
                  Browse Tractors
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="text-base px-8">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Simple Cards */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-gray-900">Why Choose TractorRent?</h2>
            <p className="text-gray-600">Trusted by farmers across Nepal</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="card-hover border border-gray-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Quality Equipment</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Well-maintained tractors from trusted brands, regularly serviced and inspected.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover border border-gray-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Flexible Booking</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Rent by the hour or day. Simple 3-click booking process with instant confirmation.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover border border-gray-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Secure Payment</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Safe and secure payments via eSewa. Transparent pricing with no hidden charges.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Tractors */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-gray-900">Featured Tractors</h2>
              <p className="text-gray-600">Popular choices available for rent now</p>
            </div>
            <Link to="/tractors">
              <Button variant="outline" className="border-gray-300">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTractors.map((tractor) => (
              <TractorCard key={tractor.id} tractor={tractor} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Simple */}
      <section className="py-16 px-4 bg-primary">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-block p-3 bg-white/20 rounded-full mb-6">
            <Tractor className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white leading-tight">
            Ready to Start Farming Smarter?
          </h2>
          <p className="text-lg mb-8 text-white/95 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of farmers who trust TractorRent for their equipment needs.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-base px-10">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 bg-white">
        <div className="container mx-auto text-center text-sm text-gray-600">
          <p>© 2025 TractorRent. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
