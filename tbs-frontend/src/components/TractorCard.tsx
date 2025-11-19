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
    <Card className="card-hover overflow-hidden border-2 border-border/60 shadow-lg bg-white rounded-2xl">
      <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-emerald-50 to-cyan-50">
        <img
          src={tractor.image}
          alt={tractor.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        {typeof tractor.rating === 'number' && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-xl bg-white/95 backdrop-blur-sm px-3 py-1.5 text-sm font-bold text-secondary shadow-lg">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              {tractor.rating.toFixed(1)}
            </span>
          </div>
        )}
        <Badge 
          className={`absolute top-4 right-4 shadow-lg font-bold rounded-xl ${
            tractor.status === 'In Use' 
              ? "bg-orange-500/90 text-white" 
              : tractor.available 
              ? "bg-primary text-white" 
              : "bg-gray-500 text-white"
          }`}
        >
          {tractor.status || (tractor.available ? 'Available' : 'Unavailable')}
        </Badge>
      </div>
    
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-1.5 text-secondary">{tractor.name}</h3>
        <p className="text-sm text-muted-foreground mb-5 font-medium">{tractor.model}</p>
      
        <div className="space-y-3 mb-5">
          <div className="flex items-center text-sm text-secondary font-semibold">
            <MapPin className="mr-2.5 h-4 w-4 text-primary" />
            {tractor.location || 'Location not specified'}
          </div>
          <div className="flex items-center text-sm text-secondary font-semibold">
            <Zap className="mr-2.5 h-4 w-4 text-primary" />
            {tractor.horsePower != null ? `${tractor.horsePower} HP` : 'Power N/A'}
          </div>
          {tractor.fuelType && (
            <div className="flex items-center text-sm text-secondary font-semibold">
              <Fuel className="mr-2.5 h-4 w-4 text-primary" />
              {tractor.fuelType}
            </div>
          )}
          {typeof tractor.fuelLevel === 'number' && (
            <div className="flex items-center text-sm text-secondary font-semibold">
              <Fuel className="mr-2.5 h-4 w-4 text-primary" />
              Fuel {tractor.fuelLevel}%
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-5 border-t-2 border-border/40">
          <div>
            <p className="text-3xl font-bold text-primary">रू {tractor.hourlyRate}</p>
            <p className="text-sm text-muted-foreground font-medium">per hour</p>
          </div>
          {typeof tractor.totalBookings === 'number' && (
            <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
              {tractor.totalBookings} bookings
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Link to={`/tractors/${tractor.id}`} className="w-full">
          <Button 
            className="w-full font-bold text-base h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
            size="lg" 
            disabled={!tractor.available}
          >
            View Details & Book
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default TractorCard;
