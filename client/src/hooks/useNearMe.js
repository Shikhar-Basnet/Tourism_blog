import { useState } from "react";
import { fetchNearbyDestinations } from "../services/destinationService.js";

export function useNearMe() {
  const [nearby, setNearby] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const locate = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location access.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const results = await fetchNearbyDestinations(pos.coords.latitude, pos.coords.longitude);
          setNearby(results);
        } catch {
          setError("Couldn't fetch nearby destinations right now.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location access was denied.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clear = () => {
    setNearby(null);
    setError("");
  };

  return { nearby, loading, error, locate, clear };
}