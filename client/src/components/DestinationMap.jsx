import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, ExternalLink, X, Loader2 } from "lucide-react";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Vite breaks Leaflet's default marker icon path resolution — reset it manually.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// Simple blue dot for "you are here" — distinct from the destination pin
// without needing another image asset.
const youAreHereIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Free, no-API-key OSRM public demo router. Good for lightweight route
// preview; it's rate-limited and not meant for heavy production traffic,
// which is why we also offer a Google Maps link as a reliable fallback.
const OSRM_URL = (fromLat, fromLng, toLat, toLng) =>
  `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

const googleDirectionsUrl = (fromLat, fromLng, toLat, toLng) =>
  `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`;

function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

// Re-fits the map viewport whenever the route changes — has to live inside
// <MapContainer> to access the underlying Leaflet map instance via useMap().
function FitToRoute({ bounds }) {
  const map = useMap();
  if (bounds) map.fitBounds(bounds, { padding: [32, 32] });
  return null;
}

export default function DestinationMap({ lat, lng, title, height = "320px" }) {
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState(null); // { positions: [[lat,lng],...], distance, duration }
  const [status, setStatus] = useState("idle"); // idle | locating | routing | done | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleGetDirections = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Your browser doesn't support location access.");
      return;
    }

    setStatus("locating");
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const from = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(from);
        setStatus("routing");

        try {
          const res = await fetch(OSRM_URL(from.lat, from.lng, lat, lng));
          if (!res.ok) throw new Error("Routing service unavailable");
          const data = await res.json();
          const leg = data.routes?.[0];
          if (!leg) throw new Error("No route found");

          const positions = leg.geometry.coordinates.map(([routeLng, routeLat]) => [routeLat, routeLng]);
          setRoute({ positions, distance: leg.distance, duration: leg.duration });
          setStatus("done");
        } catch (err) {
          setStatus("error");
          setErrorMsg("Couldn't calculate a route right now. Try opening it in Google Maps instead.");
        }
      },
      () => {
        setStatus("error");
        setErrorMsg("Location access was denied — enable it in your browser to get directions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [lat, lng]);

  const clearDirections = () => {
    setRoute(null);
    setUserLocation(null);
    setStatus("idle");
    setErrorMsg("");
  };

  if (lat == null || lng == null) return null;

  const bounds = route ? L.latLngBounds(route.positions) : null;
  const isBusy = status === "locating" || status === "routing";

  return (
    <div className="relative isolate overflow-hidden rounded-2xl shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
      <MapContainer center={[lat, lng]} zoom={12} scrollWheelZoom={false} style={{ height, width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>{title}</Popup>
        </Marker>

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={youAreHereIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {route && (
          <>
            <Polyline positions={route.positions} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.85 }} />
            <FitToRoute bounds={bounds} />
          </>
        )}
      </MapContainer>

      <div className="border-t border-gray-100 bg-white p-3">
        {status === "idle" && (
          <button
            type="button"
            onClick={handleGetDirections}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            <Navigation size={14} /> Directions from my location
          </button>
        )}

        {isBusy && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-600">
            <Loader2 size={14} className="animate-spin text-blue-600" />
            {status === "locating" ? "Finding your location..." : "Calculating route..."}
          </div>
        )}

        {status === "done" && route && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-blue-50 px-3 py-2">
            <p className="text-sm text-gray-900">
              <span className="font-semibold text-blue-700">{formatDistance(route.distance)}</span>
              <span className="text-gray-600"> · {formatDuration(route.duration)} by car</span>
            </p>
            <div className="flex items-center gap-3">
              <a
                href={googleDirectionsUrl(userLocation.lat, userLocation.lng, lat, lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                Open in Google Maps <ExternalLink size={12} />
              </a>
              <button
                type="button"
                onClick={clearDirections}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Clear directions"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-2">
            <p className="text-xs text-red-600">{errorMsg}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGetDirections}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Try again
              </button>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                Open in Google Maps <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}