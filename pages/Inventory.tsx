
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { propertyStore } from '../services/propertyService';
import { settingsStore } from '../services/settingsService';
import { 
  Home, Plus, Upload, Search, Check, 
  MapPin, BedDouble, Bath, Ruler, 
  Loader2, FileCode, AlertTriangle, Filter, X, 
  Database, Info, Tag, Briefcase, Maximize2, 
  Trees, Euro, ChevronLeft, ChevronRight, Share2, ClipboardList,
  Download, Printer, Phone, Mail, Globe, User, Award, Zap
} from 'lucide-react';
import { Property, Brand, AdvisorProfile } from '../types';

const Inventory: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>(propertyStore.getProperties());
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showProspectus, setShowProspectus] = useState(false);
  const [activeBrand, setActiveBrand] = useState<Brand>(settingsStore.getBrands()[0]);
  const [profile, setProfile] = useState<AdvisorProfile>(settingsStore.getProfile());
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSyncingXml, setIsSyncingXml] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [importLog, setImportLog] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubProperties = propertyStore.subscribe(() => setProperties(propertyStore.getProperties()));
    const unsubSettings = settingsStore.subscribe(() => {
      setProfile(settingsStore.getProfile());
      const currentBrands = settingsStore.getBrands();
      // Oppdater activeBrand hvis det ble endret i settings
      const updatedActive = currentBrands.find(b => b.id === activeBrand.id);
      if (updatedActive) setActiveBrand(updatedActive);
    });
    return () => {
      unsubProperties();
      unsubSettings();
    };
  }, [activeBrand.id]);

  // PDF-basert lokasjonskunnskap
  const getLocationIntel = (location: string) => {
    const loc = location.toLowerCase();
    if (loc.includes('pinoso') || loc.includes('biar') || loc.includes('aspe')) {
      return {
        title: "Costa Blanca Innlandet – Investering i Livsstil og Frihet",
        highlights: ["Store tomter (min. 10 000 m²)", "Lav inngangspris", "Autentisk spansk kultur", "Suelo Rústico - Juridisk trygghet"],
        description: "Her får du rom, natur og frihet for samme pris som en liten kystleilighet. Investeringen beskyttes av en sterk, autentisk kultur uavhengig av turismesvingninger."
      };
    }
    if (loc.includes('altea')) {
      return {
        title: "Altea – Middelhavets Kunstnerperle",
        highlights: ["Pittoresk gamleby", "Hvitkalkede hus", "Kulturhovedstad i Valencia", "8 km variert kystlinje"],
        description: "Altea er en autentisk skatt ved Middelhavet. Orienteringen av rommene og store vinduer i dette området favner sameksistensen mellom interiør og eksteriør."
      };
    }
    if (loc.includes('benidorm')) {
      return {
        title: "Benidorm – Moderne Komfort & Puls",
        highlights: ["Middelhavets Manhattan", "To prisbelønte strender", "300 soldager i året", "Helårstjenester"],
        description: "En by som har mestret kunsten å overraske. Fra den historiske gamlebyen til moderne skyskrapere, tilbyr Benidorm en unik kombinasjon av urbant liv og strandparadis."
      };
    }
    if (loc.includes('calpe')) {
      return {
        title: "Calpe – Fiskerlandsbyens Sjel",
        highlights: ["Ikoniske Peñón de Ifach", "Saltvannslaguner med flamingoer", "Fersk sjømat i fokus", "Familievennlige sandstrender"],
        description: "Calpe lever i skyggen av giganten Ifach. Byen har bevart sin fiskerlandsbysjel samtidig som den er et topp moderne feriemål."
      };
    }
    return {
      title: `Eksklusiv bolig i ${location}`,
      highlights: ["Moderne design", "Høy energieffektivitet", "Privat bassengmulighet", "Nærhet til fasiliteter"],
      description: "En unik mulighet til å sikre seg en kvalitetsbolig i hjertet av Costa Blanca, skreddersydd for en moderne middelhavslivsstil."
    };
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      const matchesMaxPrice = !maxPrice || prop.price <= parseInt(maxPrice);
      const matchesSearch = !searchQuery || 
        prop.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        prop.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prop.developer && prop.developer.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (prop.external_id && prop.external_id.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesMaxPrice && matchesSearch;
    });
  }, [properties, maxPrice, searchQuery]);

  const formatDescription = (text: string) => {
    if (!text) return "";
    return text
      .replace(/&#13;/g, '\n')
      .replace(/<[^>]*>?/gm, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  };

  const processXmlIncremental = async (xmlText: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    let nodes = xmlDoc.getElementsByTagName("property");
    if (nodes.length === 0) nodes = xmlDoc.getElementsByTagName("item");
    const total = nodes.length;
    if (total === 0) throw new Error("XML-filen inneholder ingen gyldige boligdata.");
    setSyncProgress({ current: 0, total });
    setImportLog(`Starter import...`);
    const CHUNK_SIZE = 25; 
    let currentChunk: Property[] = [];
    for (let i = 0; i < total; i++) {
      const prop = propertyStore.parseSingleNode(nodes[i], i);
      if (prop) {
        prop.description = formatDescription(prop.description || "");
        currentChunk.push(prop);
      }
      if (currentChunk.length >= CHUNK_SIZE || i === total - 1) {
        propertyStore.addChunk(currentChunk);
        setSyncProgress({ current: i + 1, total });
        currentChunk = [];
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    setImportLog(`Vellykket! Importert ${total} boliger.`);
  };

  const handleXmlFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsSyncingXml(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try { await processXmlIncremental(e.target?.result as string); }
      catch (err: any) { setError(err.message); }
      finally { setIsSyncingXml(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsText(file);
  };

  const intel = selectedProperty ? getLocationIntel(selectedProperty.location) : null;

  // Dynamiske stiler basert på brandets visualStyles
  const brandPrimary = activeBrand.visualStyles?.primaryColor || '#4f46e5';
  const brandSecondary = activeBrand.visualStyles?.secondaryColor || '#06b6d4';
  const headingFont = activeBrand.visualStyles?.fontHeading || 'Space Mono';
  const bodyFont = activeBrand.visualStyles?.fontBody || 'Roboto';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold neon-text text-cyan-400 mb-2">Inventory HQ</h1>
          <p className="text-slate-400">Database: <span className="text-white font-bold">{properties.length}</span> boliger lagret lokalt.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <input type="file" ref={fileInputRef} onChange={handleXmlFileChange} accept=".xml" className="hidden" />
           <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20">
            <Upload size={20} /> Last opp XML
          </button>
        </div>
      </header>

      {/* FILTERS */}
      <section className="glass p-6 lg:p-10 rounded-[3rem] border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-3"><Filter size={18} className="text-cyan-400" /> Filter</h3>
        <div className="flex gap-4 w-full md:w-auto">
           <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Søk i Ref, By, eller Utbygger..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-200 focus:border-cyan-500 outline-none" />
           </div>
           <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Maks Pris" className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-slate-200 focus:border-cyan-500 w-40 outline-none" />
        </div>
      </section>

      {/* PROGRESS */}
      {isSyncingXml && (
        <div className="p-8 glass border border-cyan-500/30 rounded-[2.5rem] space-y-4">
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-4"><Loader2 className="animate-spin text-cyan-400" size={28} /><div><span className="text-lg font-bold text-slate-100 block">Behandler database...</span><span className="text-xs font-mono text-cyan-500/70">{importLog}</span></div></div>
              <span className="text-2xl font-bold text-cyan-400 font-mono">{Math.round((syncProgress.current / syncProgress.total) * 100)}%</span>
           </div>
           <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900"><div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }} /></div>
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProperties.slice(0, 48).map(prop => (
          <div key={prop.id} onClick={() => { setSelectedProperty(prop); setActiveImageIndex(0); }} className="glass rounded-[2.5rem] border border-slate-800 overflow-hidden group hover:border-cyan-500/50 transition-all cursor-pointer shadow-xl animate-in zoom-in-95">
            <div className="relative h-64 overflow-hidden bg-slate-900">
              <img src={prop.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-cyan-400 border border-cyan-500/20">€{prop.price?.toLocaleString()}</div>
            </div>
            <div className="p-8 space-y-4">
              <h4 className="font-bold text-slate-100 group-hover:text-cyan-400 text-lg line-clamp-1">{prop.title}</h4>
              <div className="flex items-center gap-2 text-slate-500 text-xs"><MapPin size={14} className="text-cyan-600" /> {prop.location}</div>
              <div className="flex gap-4 pt-4 border-t border-slate-800/50 text-slate-400 text-xs">
                 <div className="flex items-center gap-1.5"><BedDouble size={14} /> {prop.bedrooms}</div>
                 <div className="flex items-center gap-1.5"><Bath size={14} /> {prop.bathrooms}</div>
                 <div className="flex items-center gap-1.5"><Ruler size={14} /> {prop.area}m²</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PROPERTY MODAL */}
      {selectedProperty && !showProspectus && (
        <div className="fixed inset-0 z-[300] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4 lg:p-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-full max-w-7xl bg-[#08080a] border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl h-[95vh] flex flex-col relative">
            {isFullScreen && (
              <div className="absolute inset-0 z-[400] bg-black flex items-center justify-center animate-in fade-in">
                <button onClick={() => setIsFullScreen(false)} className="absolute top-8 right-8 p-4 bg-slate-900/80 rounded-full text-white hover:bg-slate-800 z-[410]"><X size={32} /></button>
                <img src={selectedProperty.gallery?.[activeImageIndex] || selectedProperty.imageUrl} className="max-w-full max-h-full object-contain shadow-2xl" />
              </div>
            )}
            <header className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/10">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20"><Home className="text-cyan-400" size={32} /></div>
                <div><h2 className="text-2xl font-bold text-white mb-1">{selectedProperty.title}</h2><p className="text-[11px] font-mono text-cyan-500 uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> {selectedProperty.location}</p></div>
              </div>
              <button onClick={() => setSelectedProperty(null)} className="p-4 bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white shadow-xl transition-all"><X size={24} /></button>
            </header>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-4">
                     <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl group">
                        <img src={selectedProperty.gallery?.[activeImageIndex] || selectedProperty.imageUrl} className="w-full h-full object-cover transition-transform duration-700" />
                        <button onClick={() => setIsFullScreen(true)} className="absolute bottom-6 right-6 p-4 bg-slate-950/60 backdrop-blur-md rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-500"><Maximize2 size={24} /></button>
                     </div>
                     <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                        {selectedProperty.gallery?.map((img, i) => (
                          <button key={i} onClick={() => setActiveImageIndex(i)} className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${activeImageIndex === i ? 'border-cyan-500 scale-95' : 'border-slate-800 opacity-60 hover:opacity-100'}`}><img src={img} className="w-full h-full object-cover" /></button>
                        ))}
                     </div>
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                     <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] shadow-inner text-center"><span className="text-[10px] font-mono text-slate-500 uppercase mb-2 block tracking-widest">Markedspris</span><p className="text-4xl font-bold text-white font-mono">€{selectedProperty.price?.toLocaleString()}</p></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-3xl text-center"><span className="text-[9px] font-mono text-slate-500 uppercase mb-1 block">Boareal</span><p className="text-xl font-bold text-slate-200">{selectedProperty.area} m²</p></div>
                        <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-3xl text-center"><span className="text-[9px] font-mono text-slate-500 uppercase mb-1 block">REF</span><p className="text-sm font-bold text-cyan-500 uppercase">{selectedProperty.external_id}</p></div>
                     </div>
                  </div>
               </div>
               <div className="mt-12 space-y-6">
                  <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3 pb-4 border-b border-slate-800"><Info size={24} className="text-cyan-500" /> Eiendomsbeskrivelse</h3>
                  <div className="p-10 lg:p-14 bg-slate-900/20 border border-slate-800 rounded-[3rem] shadow-inner"><p className="text-slate-300 text-lg leading-[2] whitespace-pre-wrap font-sans">{selectedProperty.description}</p></div>
               </div>
            </div>
            <footer className="p-8 border-t border-slate-800 bg-slate-900/20 flex justify-between items-center gap-4">
               <button onClick={() => setShowProspectus(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"><Share2 size={18} /> Del Prospekt</button>
               <div className="flex gap-3">
                  <button className="px-10 py-4 bg-cyan-500 text-slate-950 rounded-2xl font-bold text-sm hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"><Plus size={18} /> Legg til i Pipeline</button>
               </div>
            </footer>
          </div>
        </div>
      )}

      {/* PROSPECTUS GENERATOR MODAL */}
      {showProspectus && selectedProperty && intel && (
        <div className="fixed inset-0 z-[500] bg-white text-slate-900 flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300 overflow-hidden" style={{ fontFamily: bodyFont }}>
          <link href={`https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}&family=${bodyFont.replace(/ /g, '+')}&display=swap`} rel="stylesheet" />
          
          {/* TOOLBAR */}
          <div className="bg-slate-950 text-white p-4 flex justify-between items-center print:hidden border-b border-slate-800">
             <div className="flex items-center gap-6">
                <button onClick={() => setShowProspectus(false)} className="p-2 hover:bg-slate-800 rounded-lg"><X size={24} /></button>
                <div className="h-6 w-px bg-slate-800" />
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-mono text-slate-500 uppercase">Brand:</span>
                   <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      {settingsStore.getBrands().map(b => (
                        <button 
                          key={b.id} 
                          onClick={() => setActiveBrand(b)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeBrand.id === b.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                          style={activeBrand.id === b.id ? { backgroundColor: brandPrimary } : {}}
                        >
                          {b.name}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
             <div className="flex gap-3">
                <button onClick={() => window.print()} className="px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-all shadow-lg" style={{ backgroundColor: brandPrimary, color: 'white' }}><Printer size={16} /> Print / PDF</button>
                <button className="px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-all shadow-lg" style={{ backgroundColor: brandSecondary, color: 'white' }}><Phone size={16} /> WhatsApp</button>
             </div>
          </div>

          {/* DOCUMENT VIEW */}
          <div className="flex-1 overflow-y-auto bg-slate-100 p-4 lg:p-12 custom-scrollbar">
             <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[1rem] overflow-hidden min-h-[1400px] flex flex-col p-12 lg:p-20 space-y-12">
                
                {/* HEAD - BRANDING */}
                <header className="flex justify-between items-start border-b-4 pb-8" style={{ borderColor: brandPrimary }}>
                   <div className="space-y-4">
                      {activeBrand.logo ? (
                        <img src={activeBrand.logo} className="h-16 w-auto object-contain" />
                      ) : (
                        <div className="flex items-center gap-2" style={{ color: brandPrimary }}><Award size={32} /><h1 className="text-2xl font-bold uppercase tracking-tighter" style={{ fontFamily: headingFont }}>{activeBrand.name}</h1></div>
                      )}
                      <div className="space-y-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeBrand.description}</p>
                         <p className="text-sm font-medium text-slate-600">{activeBrand.website}</p>
                      </div>
                   </div>
                   <div className="text-right space-y-2">
                      <div className="flex items-center justify-end gap-3">
                         <div className="text-right">
                            <p className="text-xs font-bold text-slate-900 uppercase">{profile.name}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: brandPrimary }}>Property Advisor</p>
                         </div>
                         <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                            {profile.imageUrl && <img src={profile.imageUrl} className="w-full h-full object-cover" />}
                         </div>
                      </div>
                      <div className="space-y-0.5 text-[11px] text-slate-500 font-medium">
                         <p className="flex items-center justify-end gap-2">{activeBrand.phone} <Phone size={10} /></p>
                         <p className="flex items-center justify-end gap-2">{activeBrand.email} <Mail size={10} /></p>
                      </div>
                   </div>
                </header>

                {/* HERO SECTION */}
                <section className="space-y-8">
                   <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
                      <img src={selectedProperty.imageUrl} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-10 pt-20">
                         <h2 className="text-4xl font-bold text-white leading-tight uppercase tracking-tight" style={{ fontFamily: headingFont }}>{selectedProperty.title}</h2>
                         <div className="flex items-center gap-3 text-white/90 text-sm mt-2 font-medium">
                            <MapPin size={18} fill="currentColor" /> {selectedProperty.location} • {selectedProperty.external_id}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: 'Pris', val: `€${selectedProperty.price?.toLocaleString()}`, icon: <Euro size={16} /> },
                        { label: 'Areal', val: `${selectedProperty.area} m²`, icon: <Ruler size={16} /> },
                        { label: 'Soverom', val: selectedProperty.bedrooms, icon: <BedDouble size={16} /> },
                        { label: 'Baderom', val: selectedProperty.bathrooms, icon: <Bath size={16} /> },
                      ].map((item, i) => (
                        <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                           <div className="flex justify-center mb-2" style={{ color: brandPrimary }}>{item.icon}</div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                           <p className="text-lg font-bold text-slate-900 font-mono">{item.val}</p>
                        </div>
                      ))}
                   </div>
                </section>

                {/* AREA INTEL */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-10 rounded-[2rem] border" style={{ backgroundColor: `${brandPrimary}10`, borderColor: `${brandPrimary}20` }}>
                   <div className="space-y-4">
                      <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: brandPrimary }}><Zap size={20} /> {intel.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium italic">"{intel.description}"</p>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: brandSecondary }}>Nøkkelpunkter for området:</p>
                      <ul className="space-y-3">
                         {intel.highlights.map((h, i) => (
                           <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-700">
                              <CheckCircle2 size={16} color={brandPrimary} /> {h}
                           </li>
                         ))}
                      </ul>
                   </div>
                </section>

                {/* DESCRIPTION */}
                <section className="space-y-6">
                   <h3 className="text-xl font-bold uppercase tracking-wider border-l-4 pl-4" style={{ color: brandPrimary, borderColor: brandPrimary, fontFamily: headingFont }}>Eiendomsbeskrivelse</h3>
                   <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-[1.8] prose-p:text-base">
                      <p className="whitespace-pre-wrap">{selectedProperty.description}</p>
                   </div>
                </section>

                {/* FOOTER */}
                <footer className="mt-auto pt-12 border-t border-slate-100 flex flex-col items-center text-center space-y-6">
                   <div className="space-y-2">
                      <p className="text-lg font-bold text-slate-900 italic">"Gjør drømmen om et liv i solen til din virkelighet."</p>
                      <p className="text-sm text-slate-500 font-medium">Kontakt meg i dag for en uforpliktende samtale eller digital visning.</p>
                   </div>
                   <div className="flex gap-12">
                      <div className="flex flex-col items-center">
                         <div className="p-3 rounded-full mb-2" style={{ backgroundColor: `${brandPrimary}10`, color: brandPrimary }}><Phone size={20} /></div>
                         <p className="text-xs font-bold">{activeBrand.phone}</p>
                      </div>
                      <div className="flex flex-col items-center">
                         <div className="p-3 rounded-full mb-2" style={{ backgroundColor: `${brandPrimary}10`, color: brandPrimary }}><Globe size={20} /></div>
                         <p className="text-xs font-bold">{activeBrand.website.replace('https://', '')}</p>
                      </div>
                   </div>
                </footer>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckCircle2 = ({ size, color }: { size: number, color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default Inventory;
