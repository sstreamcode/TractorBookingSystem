package com.example.demo.util;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.demo.model.Booking;
import com.example.demo.model.Tractor;

public final class TrackingMapper {

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
        }
        return payload;
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
}

