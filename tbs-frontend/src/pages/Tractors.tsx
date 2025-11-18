import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, Tractor as TractorIcon, Calendar, Fuel, Gauge, MapPin, Clock3, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTractorsForUI } from '@/lib/api';
import type { Tractor } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';

// Carousel component for tractor images
interface TractorImageCarouselProps {
  tractorId: string;
  gallery: string[];
  hasMultipleImages: boolean;
  onIndexChange: (index: number) => void;
  currentIndex: number;
  children: React.ReactNode;
}

const TractorImageCarousel = ({ 
  tractorId, 
  gallery, 
  hasMultipleImages, 
  onIndexChange,
  currentIndex,
  children 
}: TractorImageCarouselProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Auto-rotate every 1 second when not hovered and has multiple images
  useEffect(() => {
    if (!hasMultipleImages || isHovered || gallery.length <= 1) return;

    const interval = setInterval(() => {
      onIndexChange((currentIndex + 1) % gallery.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [gallery.length, hasMultipleImages, isHovered, currentIndex, onIndexChange]);

  return (
    <div 
      className="relative aspect-[16/9] w-full overflow-hidden bg-emerald-50/60"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {hasMultipleImages && gallery.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {gallery.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex 
                  ? 'w-6 bg-white' 
                  : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Tractors = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [hpMin, setHpMin] = useState(0);
  const [hpMax, setHpMax] = useState(300);
  const [minRating, setMinRating] = useState(0);
  const { t } = useLanguage();
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
  // Track active image index for each tractor
  const [tractorImageIndices, setTractorImageIndices] = useState<Record<string, number>>({});
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [selectedTractor, setSelectedTractor] = useState<Tractor | null>(null);
  const [dialogDetails, setDialogDetails] = useState<{
    message: string;
    status: string;
    nextAvailableText: string;
    location: string;
  } | null>(null);

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

  const translateStatusText = useCallback(
    (status?: string, available?: boolean) => {
      const normalized = (status || '').toLowerCase();
      if (normalized.includes('in use')) return t('status.in_use');
      if (normalized.includes('book')) return t('status.booked');
      if (normalized.includes('unavailable')) return t('status.unavailable');
      if (normalized.includes('available')) return t('status.available');
      return available ? t('status.available') : t('status.unavailable');
    },
    [t]
  );

  const filteredTractors = tractors.filter(tractor => {
    const matchesSearch =
      tractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tractor.model?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === 'all' || tractor.location === locationFilter;
    // Only show as unavailable if available is explicitly false (quantity reached 0)
    const matchesAvailability =
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && tractor.available) ||
      (availabilityFilter === 'unavailable' && !tractor.available && (tractor.status === 'Booked' || !tractor.available));
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

  const buildAvailabilityDetails = useCallback(
    (tractor?: Tractor | null) => {
      if (!tractor) {
        return {
          message: t('tractors.dialog.defaultMessage'),
          status: t('status.unavailable'),
          nextAvailableText: t('tractors.dialog.notScheduled'),
          location: t('tractors.dialog.locationNotSpecified'),
        };
      }
      const statusText = translateStatusText(tractor.status, tractor.available);
      const nextAvailableDate = tractor.nextAvailableAt ? new Date(tractor.nextAvailableAt) : null;
      const nextText = nextAvailableDate
        ? nextAvailableDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
        : t('tractors.dialog.notScheduled');
      const message = t('tractors.dialog.statusMessage')
        .replace('{name}', tractor.name)
        .replace('{status}', statusText);

      return {
        message,
        status: statusText,
        nextAvailableText: nextText,
        location: tractor.location ?? t('tractors.dialog.locationNotSpecified'),
      };
    },
    [t, translateStatusText]
  );

  const handleUnavailableClick = (tractor: Tractor) => {
    setSelectedTractor(tractor);
    setDialogDetails(buildAvailabilityDetails(tractor));
    setShowAvailabilityDialog(true);
  };

  useEffect(() => {
    if (showAvailabilityDialog) {
      setDialogDetails(buildAvailabilityDetails(selectedTractor));
    }
  }, [showAvailabilityDialog, selectedTractor, buildAvailabilityDetails]);

  const handleDialogToggle = (open: boolean) => {
    setShowAvailabilityDialog(open);
    if (!open) {
      setSelectedTractor(null);
      setDialogDetails(null);
    } else {
      setDialogDetails(buildAvailabilityDetails(selectedTractor));
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-secondary">{t('tractors.header.title')}</h1>
            <p className="text-muted-foreground">{t('tractors.header.subtitle')}</p>
          </div>
          <Button variant="outline" onClick={() => setShowFilters(s => !s)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {showFilters ? t('tractors.filters.toggle.hide') : t('tractors.filters.toggle.show')}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="rounded-xl border bg-card p-4 mb-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <p className="text-sm font-medium">{t('tractors.filters.types')}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={typeFilter.compact} onChange={(e)=>setTypeFilter(s=>({...s,compact:e.target.checked}))} />
                    {t('tractors.filters.type.compact')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={typeFilter.row} onChange={(e)=>setTypeFilter(s=>({...s,row:e.target.checked}))} />
                    {t('tractors.filters.type.row')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={typeFilter.speciality} onChange={(e)=>setTypeFilter(s=>({...s,speciality:e.target.checked}))} />
                    {t('tractors.filters.type.speciality')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={typeFilter.utility} onChange={(e)=>setTypeFilter(s=>({...s,utility:e.target.checked}))} />
                    {t('tractors.filters.type.utility')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={typeFilter.orchard} onChange={(e)=>setTypeFilter(s=>({...s,orchard:e.target.checked}))} />
                    {t('tractors.filters.type.orchard')}
                  </label>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">
                    {t('tractors.filters.price')}: रू {minPrice} - रू {maxPrice}/{t('tractors.pricePerHour')}
                  </p>
                  <input type="range" min={0} max={5000} value={minPrice} onChange={(e)=>setMinPrice(parseInt(e.target.value))} className="w-full accent-emerald-600" />
                  <input type="range" min={0} max={5000} value={maxPrice} onChange={(e)=>setMaxPrice(parseInt(e.target.value))} className="mt-2 w-full accent-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">
                    {t('tractors.filters.hp')}: {hpMin} - {hpMax} HP
                  </p>
                  <input type="range" min={0} max={300} value={hpMin} onChange={(e)=>setHpMin(parseInt(e.target.value))} className="w-full accent-emerald-600" />
                  <input type="range" min={0} max={300} value={hpMax} onChange={(e)=>setHpMax(parseInt(e.target.value))} className="mt-2 w-full accent-emerald-600" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder={t('tractors.filters.search')} value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
                </div>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('tractors.filters.location')} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location === 'all' ? t('tractors.filters.location.all') : location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('tractors.filters.availability')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tractors.filters.availability.all')}</SelectItem>
                    <SelectItem value="available">{t('tractors.filters.availability.available')}</SelectItem>
                    <SelectItem value="unavailable">{t('tractors.filters.availability.unavailable')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={String(minRating)} onValueChange={(v)=>setMinRating(parseFloat(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('tractors.filters.rating')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t('tractors.filters.rating.any')}</SelectItem>
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
              }}>{t('tractors.filters.action.cancel')}</Button>
              <Button onClick={()=>{ /* filters already live; noop for UX */ }}>{t('tractors.filters.action.apply')}</Button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading && <p className="text-sm text-muted-foreground">{t('tractors.loading')}</p>}
        {error && <p className="text-sm text-red-500">{t('tractors.error')}</p>}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {t('tractors.showing')} {filteredTractors.length}{' '}
            {filteredTractors.length === 1 ? t('tractors.showing.unit.single') : t('tractors.showing.unit')}
          </p>
        </div>

        {/* Tractor Grid */}
        {!loading && !error && filteredTractors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTractors.map((tractor) => {
              const galleryRaw = [tractor.image, ...(tractor.images || [])].filter(Boolean);
              const gallery = Array.from(new Set(galleryRaw));
              const hasMultipleImages = gallery.length > 1;
              const currentIndex = tractorImageIndices[tractor.id] || 0;
              const activeImage = gallery[currentIndex] || tractor.image;

              return (
                <div key={tractor.id} className="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm h-full">
                  <TractorImageCarousel
                    tractorId={tractor.id}
                    gallery={gallery}
                    hasMultipleImages={hasMultipleImages}
                    currentIndex={currentIndex}
                    onIndexChange={(newIndex) => {
                      setTractorImageIndices(prev => ({
                        ...prev,
                        [tractor.id]: newIndex
                      }));
                    }}
                  >
                    {activeImage ? (
                      <img
                        src={activeImage}
                        alt={tractor.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-opacity duration-500"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center py-8">
                        <TractorIcon className="h-20 w-20 text-emerald-400" />
                      </div>
                    )}
                    {typeof t.rating === 'number' && (
                      <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow z-10">
                        ★ {t.rating.toFixed(1)}
                      </div>
                    )}
                    <div
                      className={`absolute right-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shadow z-10 ${
                        tractor.available
                          ? 'bg-emerald-100 text-emerald-700'
                          : (tractor.status || '').includes('In Use')
                          ? 'bg-primary/20 text-primary'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {translateStatusText(tractor.status, tractor.available)}
                    </div>
                  </TractorImageCarousel>
                  <div className="flex flex-col flex-grow p-6">
                    <h3 className="text-lg font-semibold text-secondary">{tractor.name}</h3>
                    <p className="text-sm text-muted-foreground">{tractor.model}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t('tractors.power')}</p>
                          <p className="font-medium">{tractor.horsePower != null ? `${tractor.horsePower} HP` : '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t('tractors.bookings')}</p>
                          <p className="font-medium">{tractor.totalBookings ?? '—'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      {typeof tractor.fuelLevel === 'number' ? (
                        <>
                          <div className="flex items-center gap-2 text-sm">
                            <Fuel className="h-4 w-4 text-emerald-600" />
                            <span className="text-muted-foreground">{t('tractors.fuelLevel')}</span>
                            <span className="ml-auto text-xs font-medium">{tractor.fuelLevel}%</span>
                          </div>
                          <div className="mt-1 h-2 rounded bg-emerald-100">
                            <div
                              className="h-2 rounded bg-emerald-600"
                              style={{ width: `${Math.min(100, tractor.fuelLevel)}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Fuel className="h-4 w-4 text-emerald-600" />
                          {t('tractors.fuelUnavailable')}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span>{tractor.location || t('tractors.location')}</span>
                    </div>
                    {tractor.nextAvailableAt && (
                      <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                        {t('tractors.card.nextAvailableLabel')}{' '}
                        <span className="font-medium text-secondary">{tractor.nextAvailableAt}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t bg-emerald-50/50 p-4 mt-auto">
                    <div>
                      <div className="text-2xl font-bold text-emerald-700">रू {tractor.hourlyRate}</div>
                      <div className="text-xs text-muted-foreground -mt-1">{t('tractors.pricePerHour')}</div>
                    </div>
                    <div className="relative">
                      {!tractor.available && (
                        <button
                          type="button"
                          onClick={() => handleUnavailableClick(tractor)}
                          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
                          aria-label="Tractor unavailable"
                        />
                      )}
                      <Link
                        to={`/tractors/${tractor.id}`}
                        onClick={(e) => {
                          if (!tractor.available) {
                            e.preventDefault();
                            handleUnavailableClick(tractor);
                          }
                        }}
                      >
                        <Button
                          className={`bg-emerald-600 hover:bg-emerald-700 ${!tractor.available ? 'opacity-60' : ''}`}
                          aria-disabled={!tractor.available}
                        >
                          {tractor.available ? t('tractors.bookNow') : t('tractors.unavailable')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <SlidersHorizontal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('tractors.empty.title')}</h3>
            <p className="text-muted-foreground">{t('tractors.empty.subtitle')}</p>
          </div>
        )}
        </div>
      </div>

      <AlertDialog open={showAvailabilityDialog} onOpenChange={handleDialogToggle}>
        <AlertDialogContent className="max-w-lg border border-primary/20 bg-white/95 backdrop-blur-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Clock3 className="h-6 w-6" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl font-semibold text-secondary">
                  {selectedTractor?.name || t('tractors.dialog.title')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground">
                  {t('tractors.dialog.subtitle')}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('tractors.dialog.currentStatus')}</span>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary capitalize">
                  {dialogDetails?.status || t('status.unavailable')}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('tractors.dialog.nextAvailable')}</span>
                <span className="font-medium text-secondary">
                  {dialogDetails?.nextAvailableText || t('tractors.dialog.notScheduled')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('tractors.dialog.currentLocation')}</span>
                <span className="font-medium text-secondary">
                  {dialogDetails?.location || t('tractors.dialog.locationNotSpecified')}
                </span>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
              <Info className="h-5 w-5 text-primary" />
              <p>{dialogDetails?.message || t('tractors.dialog.defaultMessage')}</p>
            </div>
          </div>

          <AlertDialogFooter className="mt-4">
            <Button variant="outline" onClick={() => handleDialogToggle(false)}>
              {t('tractors.dialog.close')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Tractors;
