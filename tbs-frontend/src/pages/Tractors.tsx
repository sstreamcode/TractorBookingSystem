import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, Tractor as TractorIcon, Calendar, Fuel, Gauge, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTractorsForUI } from '@/lib/api';
import type { Tractor } from '@/types';

const Tractors = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [hpMin, setHpMin] = useState(0);
  const [hpMax, setHpMax] = useState(300);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [typeFilter, setTypeFilter] = useState<{compact:boolean; row:boolean; speciality:boolean; utility:boolean; orchard:boolean}>({
    compact: false,
    row: false,
    speciality: false,
    utility: false,
    orchard: false
  });
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getTractorsForUI();
        setTractors(data);
      } catch (e) {
        setError('Failed to load tractors');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const locationOptions = Array.from(
    new Set(
      tractors
        .map(t => t.location)
        .filter((loc): loc is string => Boolean(loc && loc.trim()))
    )
  );
  const locations = ['all', ...locationOptions];

  const filteredTractors = tractors.filter(tractor => {
    const matchesSearch =
      tractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tractor.model?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === 'all' || tractor.location === locationFilter;
    const matchesAvailability =
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && tractor.available) ||
      (availabilityFilter === 'unavailable' && !tractor.available);
    const matchesPrice =
      (tractor.hourlyRate ?? 0) >= minPrice && (tractor.hourlyRate ?? 0) <= maxPrice;
    const hp = tractor.horsePower;
    const matchesHp = hp == null ? hpMin <= 0 : hp >= hpMin && hp <= hpMax;
    const rating = tractor.rating;
    const matchesRating = rating == null ? minRating <= 0 : rating >= minRating;
    const anyTypeOn = Object.values(typeFilter).some(Boolean);
    const typeOk =
      !anyTypeOn ||
      (typeFilter.compact && hp != null && hp <= 70) ||
      (typeFilter.row && hp != null && hp > 70 && hp <= 100) ||
      (typeFilter.speciality && hp != null && hp > 100) ||
      (typeFilter.utility && hp != null && hp >= 80 && hp <= 120) ||
      (typeFilter.orchard && hp != null && hp < 60);

    return matchesSearch && matchesLocation && matchesAvailability && matchesPrice && matchesHp && matchesRating && typeOk;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-secondary">Browse Tractors</h1>
            <p className="text-muted-foreground">Find available and in-use tractors in your area</p>
          </div>
          <Button variant="outline" onClick={() => setShowFilters(s => !s)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide' : 'Advanced'} Filters
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="rounded-xl border bg-card p-4 mb-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <p className="text-sm font-medium">Tractor Types</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={typeFilter.compact} onChange={(e)=>setTypeFilter(s=>({...s,compact:e.target.checked}))} />
                    Compact
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={typeFilter.row} onChange={(e)=>setTypeFilter(s=>({...s,row:e.target.checked}))} />
                    Row Crop
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={typeFilter.speciality} onChange={(e)=>setTypeFilter(s=>({...s,speciality:e.target.checked}))} />
                    Specialty
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={typeFilter.utility} onChange={(e)=>setTypeFilter(s=>({...s,utility:e.target.checked}))} />
                    Utility
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={typeFilter.orchard} onChange={(e)=>setTypeFilter(s=>({...s,orchard:e.target.checked}))} />
                    Orchard
                  </label>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Price Range: रू {minPrice} - रू {maxPrice}/hr</p>
                  <input type="range" min={0} max={5000} value={minPrice} onChange={(e)=>setMinPrice(parseInt(e.target.value))} className="w-full accent-emerald-600" />
                  <input type="range" min={0} max={5000} value={maxPrice} onChange={(e)=>setMaxPrice(parseInt(e.target.value))} className="mt-2 w-full accent-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Horsepower: {hpMin} - {hpMax} HP</p>
                  <input type="range" min={0} max={300} value={hpMin} onChange={(e)=>setHpMin(parseInt(e.target.value))} className="w-full accent-emerald-600" />
                  <input type="range" min={0} max={300} value={hpMax} onChange={(e)=>setHpMax(parseInt(e.target.value))} className="mt-2 w-full accent-emerald-600" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="Search tractors..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
                </div>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location === 'all' ? 'All Locations' : location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={String(minRating)} onValueChange={(v)=>setMinRating(parseFloat(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Minimum Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Rating</SelectItem>
                    <SelectItem value="4.0">4.0+</SelectItem>
                    <SelectItem value="4.3">4.3+</SelectItem>
                    <SelectItem value="4.5">4.5+</SelectItem>
                    <SelectItem value="4.7">4.7+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Button variant="ghost" onClick={()=>{
                setTypeFilter({compact:false,row:false,speciality:false,utility:false,orchard:false});
                setMinPrice(0); setMaxPrice(5000); setHpMin(0); setHpMax(300); setMinRating(0);
                setLocationFilter('all'); setAvailabilityFilter('all'); setSearchQuery('');
              }}>Cancel</Button>
              <Button onClick={()=>{ /* filters already live; noop for UX */ }}>Apply Filters</Button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading && <p className="text-sm text-muted-foreground">Loading tractors...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredTractors.length} {filteredTractors.length === 1 ? 'tractor' : 'tractors'}
          </p>
        </div>

        {/* Tractor Grid */}
        {!loading && !error && filteredTractors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTractors.map((t) => (
              <div key={t.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-emerald-50/60">
                  {t.image ? (
                    <img
                      src={t.image}
                      alt={t.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center py-8">
                      <TractorIcon className="h-20 w-20 text-emerald-400" />
                    </div>
                  )}
                  {typeof t.rating === 'number' && (
                    <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow">
                      ★ {t.rating.toFixed(1)}
                    </div>
                  )}
                  <div
                    className={`absolute right-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shadow ${
                      (t.status || (t.available ? 'Available' : 'Unavailable')) === 'Available'
                        ? 'bg-emerald-100 text-emerald-700'
                        : (t.status || (t.available ? 'Available' : 'Unavailable')) === 'In Use'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t.status || (t.available ? 'Available' : 'Unavailable')}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-secondary">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">{t.model}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Power</p>
                        <p className="font-medium">{t.horsePower != null ? `${t.horsePower} HP` : '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Bookings</p>
                        <p className="font-medium">{t.totalBookings ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    {typeof t.fuelLevel === 'number' ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Fuel className="h-4 w-4 text-emerald-600" />
                          <span className="text-muted-foreground">Fuel Level</span>
                          <span className="ml-auto text-xs font-medium">{t.fuelLevel}%</span>
                        </div>
                        <div className="mt-1 h-2 rounded bg-emerald-100">
                          <div
                            className="h-2 rounded bg-emerald-600"
                            style={{ width: `${Math.min(100, t.fuelLevel)}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Fuel className="h-4 w-4 text-emerald-600" />
                        Fuel data unavailable
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>{t.location || 'Location not specified'}</span>
                  </div>
                  {t.nextAvailableAt && (
                    <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                      Next Available: <span className="font-medium text-secondary">{t.nextAvailableAt}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between border-t bg-emerald-50/50 p-4">
                  <div>
                    <div className="text-2xl font-bold text-emerald-700">रू {t.hourlyRate}</div>
                    <div className="text-xs text-muted-foreground -mt-1">per hour</div>
                  </div>
                  <Link to={`/tractors/${t.id}`}>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={!t.available}>
                      {t.available ? 'Book Now' : 'Unavailable'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <SlidersHorizontal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tractors found</h3>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tractors;
