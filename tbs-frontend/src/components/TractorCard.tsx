import { Link } from 'react-router-dom';
import { MapPin, Zap, Fuel } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tractor } from '@/types';

interface TractorCardProps {
  tractor: Tractor;
}

const TractorCard = ({ tractor }: TractorCardProps) => {
  return (
    <div className="perspective-container">
      <Card className="card-3d overflow-hidden bg-gradient-card border-0 shadow-2xl group relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
        <div className="aspect-video relative overflow-hidden bg-muted">
          <img
            src={tractor.image}
            alt={tractor.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Badge 
            className="absolute top-4 right-4 shadow-xl backdrop-blur-sm z-20"
            variant={tractor.available ? "default" : "secondary"}
          >
            {tractor.available ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
      
        <CardContent className="p-6 relative z-10">
          <h3 className="text-xl font-bold mb-2 text-foreground">{tractor.name}</h3>
          <p className="text-sm text-muted-foreground mb-5 font-medium">{tractor.model}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4 text-primary" />
            {tractor.location}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Zap className="mr-2 h-4 w-4 text-primary" />
            {tractor.horsePower} HP
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Fuel className="mr-2 h-4 w-4 text-primary" />
            {tractor.fuelType}
          </div>
        </div>

          <div className="flex items-center justify-between pt-5 border-t border-border/50">
            <div>
              <p className="text-3xl font-bold text-primary">रू {tractor.hourlyRate}</p>
              <p className="text-sm text-muted-foreground font-medium">per hour</p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-6 pt-0 relative z-10">
          <Link to={`/tractors/${tractor.id}`} className="w-full">
            <Button className="w-full font-semibold shadow-lg" size="lg" disabled={!tractor.available}>
              View Details & Book
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TractorCard;
