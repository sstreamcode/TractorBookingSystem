import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Zap, Fuel, Calendar, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { mockTractors } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const TractorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const tractor = mockTractors.find(t => t.id === id);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  if (!tractor) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Tractor not found</p>
        </div>
      </div>
    );
  }

  const calculateCost = () => {
    if (!startDate || !endDate || !startTime || !endTime) return 0;
    
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    return hours > 0 ? hours * tractor.hourlyRate : 0;
  };

  const totalCost = calculateCost();

  const handleBooking = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a tractor');
      navigate('/login');
      return;
    }

    if (!startDate || !endDate || !startTime || !endTime) {
      toast.error('Please fill in all booking details');
      return;
    }

    if (totalCost <= 0) {
      toast.error('Please select valid dates and times');
      return;
    }

    // TODO: Implement actual booking API call
    toast.success('Redirecting to payment...');
    // Simulate payment redirect
    setTimeout(() => {
      toast.success('Booking confirmed! (Demo)');
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/tractors')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tractors
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Images and Details */}
          <div>
            <div className="relative aspect-video rounded-lg overflow-hidden mb-6 shadow-lg">
              <img
                src={tractor.image}
                alt={tractor.name}
                className="w-full h-full object-cover"
              />
              <Badge 
                className="absolute top-4 right-4"
                variant={tractor.available ? "default" : "secondary"}
              >
                {tractor.available ? 'Available' : 'Unavailable'}
              </Badge>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{tractor.name}</h1>
                <p className="text-lg text-muted-foreground">{tractor.model}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{tractor.location}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Power</p>
                    <p className="font-medium">{tractor.horsePower} HP</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <Fuel className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Type</p>
                    <p className="font-medium">{tractor.fuelType}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rate</p>
                    <p className="font-medium">रू {tractor.hourlyRate}/hr</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{tractor.description}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Book This Tractor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                {totalCost > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hourly Rate</span>
                      <span className="font-medium">रू {tractor.hourlyRate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{Math.ceil((new Date(`${endDate}T${endTime}`).getTime() - new Date(`${startDate}T${startTime}`).getTime()) / (1000 * 60 * 60))} hours</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="font-semibold">Total Cost</span>
                        <span className="text-2xl font-bold text-primary">रू {totalCost}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleBooking}
                  disabled={!tractor.available || totalCost <= 0}
                >
                  {!tractor.available ? 'Currently Unavailable' : 'Proceed to Payment'}
                </Button>

                {!isAuthenticated && (
                  <p className="text-sm text-center text-muted-foreground">
                    You need to <Button variant="link" className="p-0" onClick={() => navigate('/login')}>login</Button> to book this tractor
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TractorDetail;
