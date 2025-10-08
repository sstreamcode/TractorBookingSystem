import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, Clock, Tractor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import TractorCard from '@/components/TractorCard';
import { mockTractors } from '@/data/mockData';

const Index = () => {
  const featuredTractors = mockTractors.filter(t => t.available).slice(0, 3);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero z-0" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=80')] bg-cover bg-center z-0 opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/20 z-0" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-block mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <span className="text-sm font-medium">🚜 Nepal's Leading Tractor Rental Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight drop-shadow-2xl">
              Rent Quality Tractors,
              <br />
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Grow Your Farm</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-white/90 leading-relaxed max-w-2xl mx-auto">
              Access modern agricultural equipment on-demand. Simple booking, transparent pricing, reliable service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/tractors">
                <Button size="lg" variant="hero" className="text-lg px-8">
                  Browse Tractors
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="hero-outline" className="text-lg px-8">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose TractorRent?</h2>
            <p className="text-muted-foreground text-lg">Trusted by farmers across Nepal</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto perspective-container">
            <Card className="card-3d border-none shadow-2xl bg-gradient-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Quality Equipment</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Well-maintained tractors from trusted brands, regularly serviced and inspected.
                </p>
              </CardContent>
            </Card>

            <Card className="card-3d border-none shadow-2xl bg-gradient-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Flexible Booking</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Rent by the hour or day. Simple 3-click booking process with instant confirmation.
                </p>
              </CardContent>
            </Card>

            <Card className="card-3d border-none shadow-2xl bg-gradient-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Secure Payment</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Safe and secure payments via eSewa. Transparent pricing with no hidden charges.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Tractors */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Tractors</h2>
              <p className="text-muted-foreground">Popular choices available for rent now</p>
            </div>
            <Link to="/tractors">
              <Button variant="outline">
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

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Tractor className="h-16 w-16 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
            Ready to Start Farming Smarter?
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-white/95 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of farmers who trust TractorRent for their equipment needs.
          </p>
          <Link to="/register">
            <Button size="lg" variant="hero" className="text-lg px-10">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 TractorRent. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
