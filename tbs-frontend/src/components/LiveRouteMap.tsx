import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface LatLngLabel {
  lat: number;
  lng: number;
  label?: string;
}

interface LiveRouteMapProps {
  current?: LatLngLabel | null;
  destination?: LatLngLabel | null;
  route?: Array<{ lat: number; lng: number }>;
  className?: string;
  useTractorIcon?: boolean; // Use tractor icon for current location
  animateDelivery?: boolean; // Animate tractor moving along route
  showTractorAtDestination?: boolean; // Show tractor icon at destination (for delivered status)
}

const DEFAULT_CENTER: [number, number] = [27.7172, 85.324];

const tractorIconSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 7h-1.26l-.94-2.82A2 2 0 0 0 15 3H9a2 2 0 0 0-1.8 1.11L5.22 7H5a4 4 0 0 0-4 4v6a2 2 0 0 0 2 2h1a4 4 0 0 0 7.9 0h2.2a4 4 0 0 0 7.9 0H21a2 2 0 0 0 2-2v-6a4 4 0 0 0-4-4Zm-9.73-2h5.46l.67 2H8.6ZM4 11h16a2 2 0 0 1 2 2v1h-1.53a4 4 0 0 0-7.9 0H11v-2a1 1 0 0 0-1-1H4.18A2 2 0 0 1 4 11Zm2 9a2 2 0 1 1 2-2 2 2 0 0 1-2 2Zm12 0a2 2 0 1 1 2-2 2 2 0 0 1-2 2Z"/>
  </svg>`
);

// OSRM public demo server (free, no API key required)
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

// Fetch route from OSRM
const fetchRouteFromOSRM = async (startLat: number, startLng: number, endLat: number, endLng: number): Promise<Array<{ lat: number; lng: number }> | null> => {
  try {
    // OSRM format: /route/v1/{profile}/{coordinates}?overview=full&geometries=geojson
    // Coordinates format: lon1,lat1;lon2,lat2
    const url = `${OSRM_BASE_URL}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OSRM request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const geometry = route.geometry;
      
      if (geometry && geometry.coordinates && Array.isArray(geometry.coordinates)) {
        // GeoJSON format: [longitude, latitude]
        const routePoints = geometry.coordinates.map((coord: [number, number]) => ({
          lat: coord[1],
          lng: coord[0],
        }));
        
        // Ensure we have at least 2 points
        if (routePoints.length >= 2) {
          return routePoints;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch route from OSRM:', error);
    return null;
  }
};

const LiveRouteMap = ({ current, destination, route = [], className = 'h-80 w-full rounded-xl border', useTractorIcon = false, animateDelivery = false, showTractorAtDestination = false, showTractorAtOriginalLocation = false, originalLocation = null }: LiveRouteMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ current?: L.Marker; destination?: L.Marker; route?: L.Polyline; animatedTractor?: L.Marker }>({});
  const [calculatedRoute, setCalculatedRoute] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const routeFetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRouteFetchRef = useRef<{ lat: number; lng: number } | null>(null);
  const isLoadingRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);
  const currentAnimationProgressRef = useRef<number>(0); // Track animation progress for route trimming

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: current ? [current.lat, current.lng] : DEFAULT_CENTER,
      zoom: 13,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);
    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Update current marker (only show if not animating, not showing tractor at destination, and not showing at original location)
    if (!animateDelivery && !showTractorAtDestination && !showTractorAtOriginalLocation) {
      if (layersRef.current.current) {
        layersRef.current.current.remove();
        layersRef.current.current = undefined;
      }
      if (current) {
        const iconHtml = useTractorIcon
          ? `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#10b981;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:3px solid white;">
              <img src="data:image/svg+xml,${tractorIconSvg}" alt="tractor" style="width:18px;height:18px;filter:invert(1);" />
            </div>`
          : '<div style="width:18px;height:18px;border-radius:50%;background:#10b981;border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.2);"></div>';
        
        layersRef.current.current = L.marker([current.lat, current.lng], {
          icon: L.divIcon({
            className: '',
            html: iconHtml,
            iconSize: useTractorIcon ? [36, 36] : [18, 18],
            iconAnchor: useTractorIcon ? [18, 18] : [9, 9],
          }),
        }).bindTooltip(current.label || 'Your Location', { direction: 'top' }).addTo(map);
      }
    } else {
      // Hide static current marker when animating, showing tractor at destination, or showing at original location
      if (layersRef.current.current) {
        layersRef.current.current.remove();
        layersRef.current.current = undefined;
      }
    }

    // Update destination marker
    if (layersRef.current.destination) {
      layersRef.current.destination.remove();
      layersRef.current.destination = undefined;
    }
    if (destination) {
      // If showTractorAtDestination is true, show tractor icon at destination instead of pin
      if (showTractorAtDestination) {
        const tractorIconHtml = `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#10b981;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.4);border:3px solid white;">
            <img src="data:image/svg+xml,${tractorIconSvg}" alt="tractor" style="width:20px;height:20px;filter:invert(1);" />
          </div>`;
        
        layersRef.current.destination = L.marker([destination.lat, destination.lng], {
          icon: L.divIcon({
            className: '',
            html: tractorIconHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
          zIndexOffset: 1000,
        }).bindTooltip('Tractor Delivered', { direction: 'top' }).addTo(map);
      } else {
        const destinationIconSvg = encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>`
        );
        
        layersRef.current.destination = L.marker([destination.lat, destination.lng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#f97316;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:3px solid white;">
                    <img src="data:image/svg+xml,${destinationIconSvg}" alt="destination" style="width:16px;height:16px;filter:invert(1);" />
                  </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        }).bindTooltip(destination.label || 'Delivery Location', { direction: 'top' }).addTo(map);
      }
    }

    // Update route polyline
    if (layersRef.current.route) {
      layersRef.current.route.remove();
      layersRef.current.route = undefined;
    }
    
    // Don't show route if showing tractor at original location (RETURNED status) or at destination (DELIVERED)
    let segments: Array<{ lat: number; lng: number }> = [];
    
    if (!showTractorAtOriginalLocation && !showTractorAtDestination) {
      // Use provided route, calculated route, or fallback to straight line
      // Only use calculated route if it has multiple points (actual road route)
      if (route && route.length >= 2) {
        // Use provided route if available
        segments = route;
      } else if (calculatedRoute && calculatedRoute.length > 2) {
        // Use calculated route only if it has more than 2 points (actual road route)
        segments = calculatedRoute;
      } else if (current && destination) {
        // Fallback to straight line only if no route available yet
        // Don't show straight line if we're still loading
        if (!routeLoading) {
          segments = [current, destination];
        }
      }
      
      // If animating, trim the route to only show the remaining path
      if (animateDelivery && segments.length > 2 && currentAnimationProgressRef.current > 0) {
        const progress = currentAnimationProgressRef.current;
        const totalPoints = segments.length;
        const passedPoints = Math.floor(progress * totalPoints);
        // Show only the remaining route (from current position to destination)
        if (passedPoints < totalPoints - 1) {
          segments = segments.slice(passedPoints);
        } else {
          // If animation is complete, don't show route
          segments = [];
        }
      }
    }
      
    if (segments.length >= 2) {
      const latLngs = segments.map((point) => [point.lat, point.lng]) as [number, number][];
      layersRef.current.route = L.polyline(latLngs, {
        color: '#0ea5e9',
        weight: 5,
        opacity: 0.85,
        smoothFactor: 1,
      }).addTo(map);
      
      // Fit bounds to show entire route with proper padding
      if (segments.length > 2) {
        // Real route with multiple points - focus on the route
        const routeBounds = layersRef.current.route.getBounds();
        map.fitBounds(routeBounds.pad(0.2), { 
          animate: true,
          maxZoom: 15,
          padding: [50, 50]
        });
      } else {
        // Straight line fallback - fit both points
        const bounds = L.latLngBounds(
          [segments[0].lat, segments[0].lng], 
          [segments[1].lat, segments[1].lng]
        );
        map.fitBounds(bounds.pad(0.2), { 
          animate: true,
          maxZoom: 15,
          padding: [50, 50]
        });
      }
    } else if (showTractorAtOriginalLocation && originalLocation) {
      // If showing tractor at original location, focus on that location
      map.setView([originalLocation.lat, originalLocation.lng], 15, { animate: true });
    } else if (current && destination) {
      // If we have both points but no route yet, focus on both
      const bounds = L.latLngBounds(
        [current.lat, current.lng], 
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds.pad(0.2), { 
        animate: true,
        maxZoom: 15,
        padding: [50, 50]
      });
    } else if (current) {
      map.setView([current.lat, current.lng], 13, { animate: true });
    } else if (destination) {
      map.setView([destination.lat, destination.lng], 13, { animate: true });
    }
  }, [current, destination, JSON.stringify(route), calculatedRoute, useTractorIcon, showTractorAtDestination, showTractorAtOriginalLocation, originalLocation, animateDelivery]);

  // Fetch route from OSRM - only once when both current and destination are available
  useEffect(() => {
    // Don't fetch route if showing tractor at original location (RETURNED status)
    if (showTractorAtOriginalLocation) {
      setCalculatedRoute(null);
      setRouteLoading(false);
      if (routeFetchIntervalRef.current) {
        clearInterval(routeFetchIntervalRef.current);
        routeFetchIntervalRef.current = null;
      }
      return;
    }

    // Only fetch if we don't have a provided route and both points are available
    if (route && route.length >= 2) {
      setCalculatedRoute(null);
      setRouteLoading(false);
      if (routeFetchIntervalRef.current) {
        clearInterval(routeFetchIntervalRef.current);
        routeFetchIntervalRef.current = null;
      }
      return;
    }
    
    if (!current || !destination) {
      setCalculatedRoute(null);
      setRouteLoading(false);
      if (routeFetchIntervalRef.current) {
        clearInterval(routeFetchIntervalRef.current);
        routeFetchIntervalRef.current = null;
      }
      return;
    }

    // Check if we already fetched route for this destination
    const destinationKey = `${destination.lat.toFixed(6)}_${destination.lng.toFixed(6)}`;
    const currentKey = `${current.lat.toFixed(6)}_${current.lng.toFixed(6)}`;
    const routeKey = `${destinationKey}_${currentKey}`;
    
    // Only fetch if we haven't fetched for this combination yet
    const shouldFetch = !lastRouteFetchRef.current || 
      Math.abs(lastRouteFetchRef.current.lat - destination.lat) > 0.0001 ||
      Math.abs(lastRouteFetchRef.current.lng - destination.lng) > 0.0001;

    if (!shouldFetch) {
      return; // Already have route for this destination
    }

    // Don't fetch if already loading
    if (isLoadingRef.current) {
      return;
    }
    
    isLoadingRef.current = true;
    setRouteLoading(true);
    
    fetchRouteFromOSRM(current.lat, current.lng, destination.lat, destination.lng)
      .then((routePoints) => {
        if (routePoints && routePoints.length > 2) {
          // Only use if we have a real route with multiple points
          setCalculatedRoute(routePoints);
          lastRouteFetchRef.current = { lat: destination.lat, lng: destination.lng };
        } else {
          // Fallback to straight line if route fetch fails
          setCalculatedRoute(null);
        }
      })
      .catch((error) => {
        // Fallback to straight line on error
        setCalculatedRoute(null);
      })
      .finally(() => {
        setRouteLoading(false);
        isLoadingRef.current = false;
      });

    return () => {
      // Cleanup on unmount or when dependencies change
      if (routeFetchIntervalRef.current) {
        clearInterval(routeFetchIntervalRef.current);
        routeFetchIntervalRef.current = null;
      }
    };
  }, [destination?.lat, destination?.lng, current?.lat, current?.lng, route, showTractorAtOriginalLocation]); // Fetch once when both are available

  // Animation effect for delivery status
  useEffect(() => {
    // If showing tractor at destination or original location, don't animate
    if (showTractorAtDestination || showTractorAtOriginalLocation) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (layersRef.current.animatedTractor) {
        layersRef.current.animatedTractor.remove();
        layersRef.current.animatedTractor = undefined;
      }
      return;
    }

    if (!animateDelivery || !current || !destination) {
      // Stop animation if disabled or missing data
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (layersRef.current.animatedTractor) {
        layersRef.current.animatedTractor.remove();
        layersRef.current.animatedTractor = undefined;
      }
      return;
    }

    // Get the route to animate along
    const routeToAnimate = calculatedRoute && calculatedRoute.length > 2 
      ? calculatedRoute 
      : route && route.length > 2
      ? route
      : null;

    if (!routeToAnimate || routeToAnimate.length < 2) {
      return; // Need a route to animate
    }

    if (!mapRef.current) return;

    const map = mapRef.current;
    const startTime = Date.now();
    const duration = 30000; // 30 seconds for full animation
    animationStartTimeRef.current = startTime;

    // Create animated tractor marker
    const iconHtml = `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#10b981;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.4);border:3px solid white;animation:pulse 2s infinite;">
        <img src="data:image/svg+xml,${tractorIconSvg}" alt="tractor" style="width:20px;height:20px;filter:invert(1);" />
      </div>`;

    if (!layersRef.current.animatedTractor) {
      layersRef.current.animatedTractor = L.marker([routeToAnimate[0].lat, routeToAnimate[0].lng], {
        icon: L.divIcon({
          className: '',
          html: iconHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
        zIndexOffset: 1000, // Make sure it's on top
      }).bindTooltip('Delivering...', { direction: 'top', permanent: false }).addTo(map);
    }

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0); // Go full route (0 to 1.0)

      // Store progress for route trimming
      currentAnimationProgressRef.current = progress;

      // Calculate position along route
      const totalDistance = routeToAnimate.length - 1;
      const currentIndex = progress * totalDistance;
      const index1 = Math.floor(currentIndex);
      const index2 = Math.min(index1 + 1, routeToAnimate.length - 1);
      const t = currentIndex - index1;

      const point1 = routeToAnimate[index1];
      const point2 = routeToAnimate[index2];

      // Interpolate between points
      const lat = point1.lat + (point2.lat - point1.lat) * t;
      const lng = point1.lng + (point2.lng - point1.lng) * t;

      // Update marker position
      if (layersRef.current.animatedTractor) {
        layersRef.current.animatedTractor.setLatLng([lat, lng]);
      }

      // Update route polyline to remove passed segments dynamically
      if (map) {
        // Calculate remaining route segments
        const passedPoints = Math.floor(progress * routeToAnimate.length);
        if (passedPoints < routeToAnimate.length - 1) {
          const remainingRoute = routeToAnimate.slice(passedPoints);
          if (remainingRoute.length >= 2) {
            // Remove old route
            if (layersRef.current.route) {
              layersRef.current.route.remove();
            }
            // Add remaining route
            const latLngs = remainingRoute.map((point) => [point.lat, point.lng]) as [number, number][];
            layersRef.current.route = L.polyline(latLngs, {
              color: '#0ea5e9',
              weight: 5,
              opacity: 0.85,
              smoothFactor: 1,
            }).addTo(map);
          }
        } else {
          // All route passed, remove it
          if (layersRef.current.route) {
            layersRef.current.route.remove();
            layersRef.current.route = undefined;
          }
        }
      }

      if (progress < 1.0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - tractor reached destination
        // Remove route completely
        if (layersRef.current.route) {
          layersRef.current.route.remove();
          layersRef.current.route = undefined;
        }
        // Move animated tractor to destination
        const destinationPoint = routeToAnimate[routeToAnimate.length - 1];
        if (layersRef.current.animatedTractor && destinationPoint) {
          layersRef.current.animatedTractor.setLatLng([destinationPoint.lat, destinationPoint.lng]);
        }
        currentAnimationProgressRef.current = 1.0;
        animationRef.current = null;
      }
    };

    // Start animation
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [animateDelivery, showTractorAtDestination, current, destination, calculatedRoute, route]);

  return (
    <div className="relative">
      <div ref={containerRef} className={className} />
      {routeLoading && (
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 z-[1000]">
          <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-foreground font-medium">Calculating route...</span>
        </div>
      )}
    </div>
  );
};

export default LiveRouteMap;

