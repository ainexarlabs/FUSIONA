import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// The Leaflet icon assets are shipped as PNGs the CSS references by URL; that
// works at runtime but not through Vite's bundler, so we point directly at the
// files inside the leaflet package and let Vite fingerprint them.
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  height?: number | string;
  zoom?: number;
  popupContent?: string;
}

export function PropertyMap({ latitude, longitude, height = 260, zoom = 15, popupContent }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([latitude, longitude], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([latitude, longitude], { icon: defaultIcon }).addTo(map);
    if (popupContent) marker.bindPopup(popupContent);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, zoom, popupContent]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-2xl border border-black/[.07]"
      style={{ height }}
    />
  );
}
