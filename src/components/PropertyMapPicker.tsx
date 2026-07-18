import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useLocale } from '@/i18n';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Roughly centred on the served metro area (Toluca/Metepec valley).
const DEFAULT_CENTER: [number, number] = [19.2833, -99.6559];
const DEFAULT_ZOOM = 12;

interface PropertyMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number | null; longitude: number | null }) => void;
  height?: number | string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export function PropertyMapPicker({ latitude, longitude, onChange, height = 320 }: PropertyMapPickerProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const center: [number, number] =
      latitude != null && longitude != null ? [latitude, longitude] : DEFAULT_CENTER;
    const zoom = latitude != null && longitude != null ? 15 : DEFAULT_ZOOM;

    const map = L.map(containerRef.current).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    if (latitude != null && longitude != null) {
      const marker = L.marker([latitude, longitude], { icon: defaultIcon, draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current({ latitude: pos.lat, longitude: pos.lng });
      });
      markerRef.current = marker;
    }

    map.on('click', (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: defaultIcon, draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onChangeRef.current({ latitude: pos.lat, longitude: pos.lng });
        });
        markerRef.current = marker;
      }
      onChangeRef.current({ latitude: lat, longitude: lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Intentionally only run once on mount; subsequent latitude/longitude
    // changes are reflected via the sync effect below to avoid tearing down
    // the map on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (latitude == null || longitude == null) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      const marker = L.marker([latitude, longitude], { icon: defaultIcon, draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current({ latitude: pos.lat, longitude: pos.lng });
      });
      markerRef.current = marker;
    }
  }, [latitude, longitude]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        format: 'json',
        limit: '1',
        countrycodes: 'mx',
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'Accept-Language': 'es' },
      });
      if (!res.ok) throw new Error('search_failed');
      const results = (await res.json()) as NominatimResult[];
      if (results.length === 0) {
        setSearchError('—');
        return;
      }
      const lat = Number(results[0].lat);
      const lng = Number(results[0].lon);
      mapRef.current?.setView([lat, lng], 16);
      onChangeRef.current({ latitude: lat, longitude: lng });
    } catch {
      setSearchError('—');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder={t.admin.form.searchAddressPlaceholder}
          className="flex-1 rounded-[9px] border border-black/10 px-3.5 py-2.5 text-sm font-medium text-neutral-700 outline-none focus:border-fusiona-black"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !searchQuery.trim()}
          className="rounded-[9px] bg-fusiona-black px-4 py-2.5 text-xs font-extrabold uppercase tracking-wide text-white disabled:opacity-40"
        >
          {t.home.search}
        </button>
      </div>
      {searchError && <p className="text-[11px] text-fusiona-red">{searchError}</p>}
      <div ref={containerRef} className="w-full overflow-hidden rounded-2xl border border-black/[.07]" style={{ height }} />
      <div className="flex items-center justify-between text-[11px] text-neutral-500">
        <span>
          {latitude != null && longitude != null
            ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            : t.admin.form.locationCleared}
        </span>
        {latitude != null && longitude != null && (
          <button
            type="button"
            onClick={() => onChange({ latitude: null, longitude: null })}
            className="font-bold uppercase tracking-wide text-fusiona-red hover:text-fusiona-red-dark"
          >
            {t.admin.form.clearLocation}
          </button>
        )}
      </div>
    </div>
  );
}
