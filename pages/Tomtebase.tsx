import React, { useState, useMemo, useEffect } from 'react';
import { PLOT_DATA } from '../plot-data';
import { Plot, PlotStatus } from '../types';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const highlightedIcon = new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

L.Marker.prototype.options.icon = defaultIcon;

const PlotCard: React.FC<{ plot: Plot; onClick: () => void; isSelected: boolean }> = ({ plot, onClick, isSelected }) => {
  const formatPrice = (price?: number) => price?.toLocaleString('de-DE') + ' €' || 'N/A';
  const formatSize = (size?: number) => size?.toLocaleString('de-DE') + ' m²' || 'N/A';

  const getStatusChipColor = (status: PlotStatus) => {
    switch (status) {
      case PlotStatus.FOR_SALE: return 'bg-green-500/10 text-green-400 border-green-500/20';
      case PlotStatus.SOLD: return 'bg-red-500/10 text-red-400 border-red-500/20';
      case PlotStatus.RESERVED: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case PlotStatus.ON_HOLD: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  }

  return (
    <div onClick={onClick} className={`bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-cyan-500/20 hover:-translate-y-1 cursor-pointer ${isSelected ? 'border-cyan-400 shadow-cyan-500/30' : ''}`}>
      {plot.imageUrl && (
        <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${plot.imageUrl})` }}></div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-100 truncate">{plot.name}</h3>
        
        <div className="flex justify-between items-center my-3">
          <p className="text-2xl font-black text-cyan-400">{formatPrice(plot.price)}</p>
          <p className="text-lg font-bold text-amber-400">{formatSize(plot.size)}</p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusChipColor(plot.status)}`}>{plot.status}</span>
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-700/50">{plot.type}</span>
        </div>

        <p className="text-xs text-slate-500 h-10 overflow-hidden mb-2">{plot.description}</p>
        
        {plot.cadastralNumber && <p className="text-xs text-slate-600 font-mono">Ref: {plot.cadastralNumber}</p>}
      </div>
    </div>
  );
};

const MapUpdater: React.FC<{ plot: Plot | undefined }> = ({ plot }) => {
    const map = useMap();
    useEffect(() => {
        if (plot) {
            map.setView([plot.location.lat, plot.location.lng], 14, { animate: false });
        }
    }, [plot, map]);
    return null;
}

const Tomtebase: React.FC = () => {
  const [plots] = useState<Plot[]>(PLOT_DATA);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minSize: '',
    maxSize: '',
    status: 'all',
    type: 'all',
    location: '',
  });
  const [sort, setSort] = useState('price-desc');

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredAndSortedPlots = useMemo(() => {
    let filtered = plots
      .filter(p => filters.minPrice ? (p.price || 0) >= parseInt(filters.minPrice) : true)
      .filter(p => filters.maxPrice ? (p.price || 0) <= parseInt(filters.maxPrice) : true)
      .filter(p => filters.minSize ? (p.size || 0) >= parseInt(filters.minSize) : true)
      .filter(p => filters.maxSize ? (p.size || 0) <= parseInt(filters.maxSize) : true)
      .filter(p => filters.status !== 'all' ? p.status === filters.status : true)
      .filter(p => filters.type !== 'all' ? p.type === filters.type : true)
      .filter(p => filters.location ? p.name.toLowerCase().includes(filters.location.toLowerCase()) : true);

    return filtered.sort((a, b) => {
      const [key, direction] = sort.split('-');
      const valA = a[key as keyof Plot] || 0;
      const valB = b[key as keyof Plot] || 0;
      if (direction === 'asc') return (valA > valB) ? 1 : -1;
      return (valA < valB) ? 1 : -1;
    });
  }, [plots, filters, sort]);

  const locations = useMemo(() => {
      const allLocations = PLOT_DATA.map(p => p.name.split('-')[0].trim());
      return [...new Set(allLocations)];
  }, []);

  const selectedPlot = useMemo(() => plots.find(p => p.id === selectedPlotId), [plots, selectedPlotId]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white p-4 lg:p-8">
        <h1 className="text-3xl font-bold mb-6 text-slate-100">Tomtebase</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-3 bg-slate-900 p-4 rounded-lg border border-slate-800">
                <h2 className="text-lg font-semibold mb-3">Filters</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <input type="number" name="minPrice" placeholder="Min Price" value={filters.minPrice} onChange={handleFilterChange} className="bg-slate-800 border border-slate-700 rounded p-2" />
                    <input type="number" name="maxPrice" placeholder="Max Price" value={filters.maxPrice} onChange={handleFilterChange} className="bg-slate-800 border border-slate-700 rounded p-2" />
                    <input type="number" name="minSize" placeholder="Min Size m²" value={filters.minSize} onChange={handleFilterChange} className="bg-slate-800 border border-slate-700 rounded p-2" />
                    <input type="number" name="maxSize" placeholder="Max Size m²" value={filters.maxSize} onChange={handleFilterChange} className="bg-slate-800 border border-slate-700 rounded p-2" />
                    <select name="location" value={filters.location} onChange={handleFilterChange} className="bg-slate-800 border border-slate-700 rounded p-2">
                        <option value="">All Locations</option>
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="bg-slate-800 border border-slate-700 rounded p-2">
                        <option value="all">All Statuses</option>
                        {Object.values(PlotStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select name="type" value={filters.type} onChange={handleFilterChange} className="bg-slate-800 border border-slate-700 rounded p-2">
                        <option value="all">All Types</option>
                         <option value="Rústico">Rústico</option>
                         <option value="Urbano">Urbano</option>
                    </select>
                </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                <h2 className="text-lg font-semibold mb-3">Sort by</h2>
                 <select value={sort} onChange={e => setSort(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-2 w-full">
                    <option value="price-desc">Price: High to Low</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="size-desc">Size: Large to Small</option>
                    <option value="size-asc">Size: Small to Large</option>
                </select>
            </div>
        </div>

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-1 h-[600px] lg:h-auto overflow-y-auto pr-2">
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                     {filteredAndSortedPlots.map(plot => (
                        <PlotCard key={plot.id} plot={plot} onClick={() => setSelectedPlotId(plot.id)} isSelected={plot.id === selectedPlotId} />
                    ))}
                 </div>
            </div>
            <div className="lg:col-span-1 rounded-lg overflow-hidden border border-slate-800 h-[600px] lg:h-auto sticky top-24">
                 <MapContainer center={[38.38, -0.9]} zoom={10} style={{ height: '100%', width: '100%', backgroundColor: '#1e293b' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    {filteredAndSortedPlots.map(plot => (
                        <Marker key={plot.id} position={[plot.location.lat, plot.location.lng]} icon={plot.id === selectedPlotId ? highlightedIcon : defaultIcon}>
                            <Popup>
                                <div className="text-slate-800">
                                    <b>{plot.name}</b><br/>
                                    {plot.price ? `${plot.price.toLocaleString()} €` : ''}<br/>
                                    {plot.size ? `${plot.size.toLocaleString()} m²` : ''}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    <MapUpdater plot={selectedPlot} />
                </MapContainer>
            </div>
        </div>

    </div>
  );
};

export default Tomtebase;
