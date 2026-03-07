
import React, { useEffect, useRef } from 'react';
import { Property } from '../types';

interface PropertyMapProps {
  properties: Property[];
  onSelectProperty: (p: Property) => void;
}

// Approximate fallback coords by known location keywords
function guessCoordsFromLocation(location: string): [number, number] | null {
  const l = location.toLowerCase();
  if (l.includes('altea'))              return [38.5985, -0.0535];
  if (l.includes('benidorm'))           return [38.5351, -0.1321];
  if (l.includes('calpe') || l.includes('calp')) return [38.6450, 0.0444];
  if (l.includes('denia'))              return [38.8406, 0.1062];
  if (l.includes('javea') || l.includes('xàbia')) return [38.7898, 0.1737];
  if (l.includes('moraira'))            return [38.6889, 0.1258];
  if (l.includes('pinoso'))             return [38.4015, -1.0311];
  if (l.includes('biar'))               return [38.5172, -0.7695];
  if (l.includes('aspe'))               return [38.3464, -0.7698];
  if (l.includes('torrevieja'))         return [37.9783, -0.6837];
  if (l.includes('orihuela'))           return [38.0855, -0.9440];
  if (l.includes('guardamar'))          return [38.0900, -0.6538];
  if (l.includes('rojales'))            return [38.0850, -0.7256];
  if (l.includes('albir') || l.includes('alfaz')) return [38.5703, -0.0743];
  if (l.includes('villajoyosa') || l.includes('la vila')) return [38.5063, -0.2300];
  if (l.includes('costa blanca'))       return [38.5400, -0.1200];
  if (l.includes('costa calida'))       return [37.9500, -1.1300];
  return null;
}

declare global {
  interface Window { L: any; }
}

const PropertyMap: React.FC<PropertyMapProps> = ({ properties, onSelectProperty }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const init = () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const L = window.L;

      const map = L.map(mapRef.current, { zoomControl: true }).setView([38.52, -0.28], 9);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      const plotIcon = L.divIcon({
        className: '',
        html: `<div style="background:#06b6d4;border:2px solid white;border-radius:50%;width:14px;height:14px;box-shadow:0 0 6px rgba(6,182,212,0.7)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const propsWithCoords = properties.filter(p => {
        const lat = (p as any).latitude;
        const lng = (p as any).longitude;
        return lat && lng && !isNaN(lat) && !isNaN(lng);
      });

      const propsWithFallback = properties.filter(p => {
        const lat = (p as any).latitude;
        const lng = (p as any).longitude;
        return !lat || !lng || isNaN(lat) || isNaN(lng);
      });

      const allMarkerProps: { prop: Property; coords: [number, number] }[] = [
        ...propsWithCoords.map(p => ({ prop: p, coords: [(p as any).latitude, (p as any).longitude] as [number, number] })),
        ...propsWithFallback.flatMap(p => {
          const c = guessCoordsFromLocation(p.location || '');
          return c ? [{ prop: p, coords: c }] : [];
        }),
      ];

      allMarkerProps.forEach(({ prop, coords }) => {
        const marker = L.marker(coords, { icon: plotIcon }).addTo(map);
        marker.bindPopup(`
          <div style="min-width:200px;font-family:sans-serif">
            <img src="${prop.imageUrl}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:8px"/>
            <strong style="font-size:13px;display:block;margin-bottom:4px">${prop.title}</strong>
            <span style="color:#06b6d4;font-weight:700">€${prop.price?.toLocaleString()}</span>
            <span style="color:#888;font-size:11px;margin-left:6px">${prop.location}</span>
            <br/><span style="font-size:11px;color:#aaa">${prop.bedrooms} sov · ${prop.bathrooms} bad · ${prop.area}m²</span>
          </div>
        `);
        marker.on('click', () => onSelectProperty(prop));
      });

      if (allMarkerProps.length > 0) {
        try {
          const group = L.featureGroup(allMarkerProps.map(({ coords }) => L.marker(coords)));
          map.fitBounds(group.getBounds().pad(0.15));
        } catch {}
      }
    };

    if (window.L) {
      init();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = init;
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Refresh markers when properties change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const plotIcon = L.divIcon({
      className: '',
      html: `<div style="background:#06b6d4;border:2px solid white;border-radius:50%;width:14px;height:14px;box-shadow:0 0 6px rgba(6,182,212,0.7)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    properties.forEach(p => {
      let lat = (p as any).latitude;
      let lng = (p as any).longitude;
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        const c = guessCoordsFromLocation(p.location || '');
        if (!c) return;
        [lat, lng] = c;
      }
      const marker = L.marker([lat, lng], { icon: plotIcon }).addTo(map);
      marker.bindPopup(`
        <div style="min-width:200px;font-family:sans-serif">
          <img src="${p.imageUrl}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:8px"/>
          <strong style="font-size:13px;display:block;margin-bottom:4px">${p.title}</strong>
          <span style="color:#06b6d4;font-weight:700">€${p.price?.toLocaleString()}</span>
          <span style="color:#888;font-size:11px;margin-left:6px">${p.location}</span>
          <br/><span style="font-size:11px;color:#aaa">${p.bedrooms} sov · ${p.bathrooms} bad · ${p.area}m²</span>
        </div>
      `);
      marker.on('click', () => onSelectProperty(p));
    });
  }, [properties]);

  const withCoords = properties.filter(p => {
    const lat = (p as any).latitude;
    const lng = (p as any).longitude;
    return lat && lng && !isNaN(lat) && !isNaN(lng);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-500 font-mono">
          <span className="text-cyan-400 font-bold">{withCoords.length}</span> av {properties.length} boliger har GPS-koordinater ·{' '}
          <span className="text-slate-600">{properties.length - withCoords.length} bruker omtrentlig plassering</span>
        </p>
      </div>
      <div
        ref={mapRef}
        className="w-full rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl"
        style={{ height: '520px', background: '#0f172a' }}
      />
    </div>
  );
};

export default PropertyMap;
