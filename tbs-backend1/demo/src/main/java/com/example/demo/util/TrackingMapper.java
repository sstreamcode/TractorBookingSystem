package com.example.demo.util;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.example.demo.model.Booking;
import com.example.demo.model.Tractor;

public final class TrackingMapper {

    private static final String OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving";
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private TrackingMapper() {}

    public static Map<String, Object> buildPayload(Tractor tractor, Booking booking) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("tractorId", tractor.getId());
        payload.put("tractorName", tractor.getName());
        payload.put("status", tractor.getStatus());

        if (tractor.getLatitude() != null && tractor.getLongitude() != null) {
            Map<String, Object> current = new HashMap<>();
            current.put("lat", tractor.getLatitude());
            current.put("lng", tractor.getLongitude());
            if (tractor.getLocation() != null) {
                current.put("address", tractor.getLocation());
            }
            current.put("updatedAt", tractor.getLocationUpdatedAt());
            payload.put("currentLocation", current);
        } else {
            payload.put("currentLocation", null);
        }

        if (tractor.getDestinationLatitude() != null && tractor.getDestinationLongitude() != null) {
            Map<String, Object> destination = new HashMap<>();
            destination.put("lat", tractor.getDestinationLatitude());
            destination.put("lng", tractor.getDestinationLongitude());
            if (tractor.getDestinationAddress() != null) {
                destination.put("address", tractor.getDestinationAddress());
            }
            payload.put("destination", destination);

            if (tractor.getLatitude() != null && tractor.getLongitude() != null) {
                // Fetch route from OSRM for road-based routing
                RouteResult routeResult = fetchRouteFromOSRM(
                    tractor.getLongitude(),
                    tractor.getLatitude(),
                    tractor.getDestinationLongitude(),
                    tractor.getDestinationLatitude()
                );

                if (routeResult != null && routeResult.route != null && !routeResult.route.isEmpty()) {
                    payload.put("distanceKm", routeResult.distanceKm);
                    payload.put("etaMinutes", estimateEtaMinutes(routeResult.distanceKm));
                    payload.put("route", routeResult.route);
                } else {
                    // Fallback to straight-line distance if OSRM fails
                    double distanceKm = computeDistanceKm(
                        tractor.getLatitude(),
                        tractor.getLongitude(),
                        tractor.getDestinationLatitude(),
                        tractor.getDestinationLongitude()
                    );
                    payload.put("distanceKm", distanceKm);
                    payload.put("etaMinutes", estimateEtaMinutes(distanceKm));
                    payload.put("route", List.of(
                        Map.of("lat", tractor.getLatitude(), "lng", tractor.getLongitude()),
                        Map.of("lat", tractor.getDestinationLatitude(), "lng", tractor.getDestinationLongitude())
                    ));
                }
            } else {
                payload.put("route", List.of());
            }
        } else {
            payload.put("destination", null);
            payload.put("route", List.of());
        }

        if (booking != null) {
            payload.put("bookingId", booking.getId());
            payload.put("bookingStatus", booking.getStatus());
            payload.put("deliveryWindow", Map.of(
                "startAt", booking.getStartAt(),
                "endAt", booking.getEndAt()
            ));
            payload.put("deliveryAddress", booking.getDeliveryAddress());
            
            // Include original tractor location if available (for RETURNED status)
            if (booking.getOriginalTractorLatitude() != null && booking.getOriginalTractorLongitude() != null) {
                Map<String, Object> originalLocation = new HashMap<>();
                originalLocation.put("lat", booking.getOriginalTractorLatitude());
                originalLocation.put("lng", booking.getOriginalTractorLongitude());
                if (booking.getOriginalTractorLocation() != null) {
                    originalLocation.put("address", booking.getOriginalTractorLocation());
                }
                payload.put("originalLocation", originalLocation);
            } else {
                payload.put("originalLocation", null);
            }
        }
        
        // Include tractor delivery status
        if (tractor.getDeliveryStatus() != null) {
            payload.put("deliveryStatus", tractor.getDeliveryStatus());
        }
        return payload;
    }

    private static RouteResult fetchRouteFromOSRM(double lon1, double lat1, double lon2, double lat2) {
        try {
            // OSRM API format: /route/v1/{profile}/{coordinates}?overview=full&geometries=geojson
            String url = String.format("%s/%f,%f;%f,%f?overview=full&geometries=geojson",
                OSRM_BASE_URL, lon1, lat1, lon2, lat2);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode routes = root.get("routes");
                
                if (routes != null && routes.isArray() && routes.size() > 0) {
                    JsonNode route = routes.get(0);
                    JsonNode geometry = route.get("geometry");
                    JsonNode distanceNode = route.get("distance");
                    JsonNode durationNode = route.get("duration");

                    if (geometry != null && geometry.has("coordinates")) {
                        JsonNode coordinates = geometry.get("coordinates");
                        List<Map<String, Double>> routePoints = new ArrayList<>();

                        if (coordinates.isArray()) {
                            for (JsonNode coord : coordinates) {
                                if (coord.isArray() && coord.size() >= 2) {
                                    // GeoJSON format: [longitude, latitude]
                                    double lng = coord.get(0).asDouble();
                                    double lat = coord.get(1).asDouble();
                                    routePoints.add(Map.of("lat", lat, "lng", lng));
                                }
                            }
                        }

                        // Calculate distance from route (in meters, convert to km)
                        double distanceMeters = distanceNode != null ? distanceNode.asDouble(0) : 0;
                        double distanceKm = distanceMeters / 1000.0;

                        // If distance is 0, calculate from route geometry
                        if (distanceKm <= 0 && routePoints.size() >= 2) {
                            distanceKm = calculateRouteDistance(routePoints);
                        }

                        return new RouteResult(routePoints, distanceKm);
                    }
                }
            }
        } catch (Exception e) {
            // Log error but don't throw - fallback to straight-line distance
            System.err.println("Failed to fetch route from OSRM: " + e.getMessage());
        }
        return null;
    }

    private static double calculateRouteDistance(List<Map<String, Double>> routePoints) {
        if (routePoints.size() < 2) {
            return 0;
        }
        double totalDistance = 0;
        for (int i = 1; i < routePoints.size(); i++) {
            Map<String, Double> prev = routePoints.get(i - 1);
            Map<String, Double> curr = routePoints.get(i);
            totalDistance += computeDistanceKm(
                prev.get("lat"), prev.get("lng"),
                curr.get("lat"), curr.get("lng")
            );
        }
        return totalDistance;
    }

    public static double computeDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS_KM = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    public static long estimateEtaMinutes(double distanceKm) {
        if (distanceKm <= 0) return 0;
        double averageSpeedKph = 25.0; // assumption configurable
        double hours = distanceKm / averageSpeedKph;
        return Math.max(1, Math.round(hours * 60));
    }

    private static class RouteResult {
        final List<Map<String, Double>> route;
        final double distanceKm;

        RouteResult(List<Map<String, Double>> route, double distanceKm) {
            this.route = route;
            this.distanceKm = distanceKm;
        }
    }
}

