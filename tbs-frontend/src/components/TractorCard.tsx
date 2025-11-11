import { Link } from 'react-router-dom';
import { MapPin, Zap, Fuel, Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tractor } from '@/types';

interface TractorCardProps {
  tractor: Tractor;
}

const TractorCard = ({ tractor }: TractorCardProps) => {
  return (
    <Card className="card-hover overflow-hidden border border-gray-200 shadow-sm">
      <div className="aspect-video relative overflow-hidden bg-gray-100">
        <img
          src={tractor.image}
          alt={tractor.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {typeof tractor.rating === 'number' && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-gray-800 shadow">
              <Star className="h-3 w-3 text-amber-500" />
              {tractor.rating.toFixed(1)}
            </span>
          </div>
        )}
        <Badge 
          className="absolute top-3 right-3 shadow-md"
          variant={tractor.status === 'In Use' ? "secondary" : tractor.available ? "default" : "secondary"}
        >
          {tractor.status || (tractor.available ? 'Available' : 'Unavailable')}
        </Badge>
      </div>
    
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-1 text-gray-900">{tractor.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{tractor.model}</p>
      
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="mr-2 h-4 w-4 text-primary" />
            {tractor.location || 'Location not specified'}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Zap className="mr-2 h-4 w-4 text-primary" />
            {tractor.horsePower != null ? `${tractor.horsePower} HP` : 'Power N/A'}
          </div>
          {tractor.fuelType && (
            <div className="flex items-center text-sm text-gray-600">
              <Fuel className="mr-2 h-4 w-4 text-primary" />
              {tractor.fuelType}
            </div>
          )}
          {typeof tractor.fuelLevel === 'number' && (
            <div className="flex items-center text-sm text-gray-600">
              <Fuel className="mr-2 h-4 w-4 text-primary" />
              Fuel {tractor.fuelLevel}%
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <p className="text-2xl font-bold text-primary">रू {tractor.hourlyRate}</p>
            <p className="text-sm text-gray-600">per hour</p>
          </div>
          {typeof tractor.totalBookings === 'number' && (
            <span className="text-xs font-medium text-muted-foreground">
              {tractor.totalBookings} bookings
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Link to={`/tractors/${tractor.id}`} className="w-full">
          <Button className="w-full font-medium" size="lg" disabled={!tractor.available}>
            View Details & Book
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default TractorCard;
