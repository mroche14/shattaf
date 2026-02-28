"""Google Maps integration."""

from typing import Optional, Tuple
import googlemaps

from ..config import get_settings

settings = get_settings()


class MapsService:
    """Google Maps API service."""

    def __init__(self):
        if settings.GOOGLE_MAPS_API_KEY:
            self.client = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
        else:
            self.client = None

    async def geocode(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Geocode an address to coordinates.
        Returns (lat, lng) or None if not found.
        """
        if not self.client:
            return None

        try:
            results = self.client.geocode(address)
            if results:
                location = results[0]["geometry"]["location"]
                return (location["lat"], location["lng"])
            return None
        except Exception:
            return None

    async def reverse_geocode(
        self,
        lat: float,
        lng: float,
    ) -> Optional[str]:
        """
        Reverse geocode coordinates to address.
        Returns formatted address or None.
        """
        if not self.client:
            return None

        try:
            results = self.client.reverse_geocode((lat, lng))
            if results:
                return results[0]["formatted_address"]
            return None
        except Exception:
            return None

    async def autocomplete(
        self,
        query: str,
        location: Optional[Tuple[float, float]] = None,
    ) -> list[dict]:
        """
        Get address autocomplete suggestions.
        Returns list of predictions.
        """
        if not self.client:
            return []

        try:
            # Focus on Guadeloupe
            params = {
                "input_text": query,
                "components": {"country": "GP"},
            }

            if location:
                params["location"] = location
                params["radius"] = 50000  # 50km

            results = self.client.places_autocomplete(**params)
            return [
                {
                    "place_id": r["place_id"],
                    "description": r["description"],
                }
                for r in results
            ]
        except Exception:
            return []

    async def validate_guadeloupe_zone(
        self,
        lat: float,
        lng: float,
    ) -> bool:
        """
        Check if coordinates are within Guadeloupe service zone.
        """
        # Guadeloupe bounding box (approximate)
        min_lat, max_lat = 15.8, 16.6
        min_lng, max_lng = -61.9, -61.0

        return min_lat <= lat <= max_lat and min_lng <= lng <= max_lng

    async def distance_matrix(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
    ) -> Optional[dict]:
        """
        Calculate distance and duration between two points.
        Returns {distance_meters, duration_seconds} or None.
        """
        if not self.client:
            return None

        try:
            result = self.client.distance_matrix(
                origins=[origin],
                destinations=[destination],
                mode="driving",
            )

            if result["rows"] and result["rows"][0]["elements"]:
                element = result["rows"][0]["elements"][0]
                if element["status"] == "OK":
                    return {
                        "distance_meters": element["distance"]["value"],
                        "duration_seconds": element["duration"]["value"],
                    }
            return None
        except Exception:
            return None
