
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import ReactMarkdown from 'react-markdown';
import { Loader2, Zap, Newspaper, Briefcase, Home, TrendingUp } from 'lucide-react';
import { MarketTheme, Brand, AdvisorProfile } from "../types";
import { getBrands, getBrand } from "../services/brandService"; 
import { getProfile } from "../services/profileService";
import { getMarketPulse } from "../services/aiService";
import { Badge } from '../components/ui/badge';

const MarketPulse: React.FC = () => {
  const [location, setLocation] = useState('Costa Blanca');
  const [theme, setTheme] = useState<MarketTheme>(MarketTheme.GENERAL);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [profile, setProfile] = useState<AdvisorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{ text: string; sources: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [brandsData, profileData] = await Promise.all([
          getBrands(),
          getProfile()
        ]);
        setBrands(brandsData);
        setProfile(profileData);
        if (brandsData.length > 0) {
          setSelectedBrandId(brandsData[0].id);
        }
      } catch (e) {
        setError("Kunne ikke laste inn nødvendige data. Prøv igjen senere.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerate = async () => {
    if (!location || !selectedBrandId || !profile) {
      setError("Vennligst fyll inn alle felter og velg et merke.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const selectedBrand = await getBrand(selectedBrandId);
      if (!selectedBrand) throw new Error('Valgt merke ble ikke funnet.');

      const result = await getMarketPulse(location, theme, selectedBrand, profile);
      setAnalysis(result);

    } catch (err: any) {
      console.error("Feil ved generering av markedsanalyse:", err);
      setError(err.message || 'En ukjent feil oppstod under generering.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl lg:text-4xl font-bold neon-text text-cyan-400">Markedspuls</h1>
        <p className="text-xs lg:text-sm text-slate-400">AI-drevet innsikt i det spanske eiendomsmarkedet.</p>
      </header>

      <Card className="p-4 lg:p-6 space-y-4 border-slate-800 bg-slate-950/40 shadow-2xl shadow-slate-950/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Område</label>
            <input 
              type="text" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              placeholder="F.eks. Villajoyosa" 
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Tema</label>
            <Select value={theme} onValueChange={(value) => setTheme(value as MarketTheme)}>
                <SelectTrigger className="w-full bg-slate-900 border-slate-700 rounded-md text-sm text-slate-200 focus:border-cyan-500">
                    <SelectValue placeholder="Velg tema" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-slate-200 border-slate-700">
                    <SelectItem value={MarketTheme.GENERAL}><Newspaper className="inline-block w-4 h-4 mr-2" />Generell analyse</SelectItem>
                    <SelectItem value={MarketTheme.INVESTMENT}><Briefcase className="inline-block w-4 h-4 mr-2" />Investering</SelectItem>
                    <SelectItem value={MarketTheme.LUXURY}><Home className="inline-block w-4 h-4 mr-2" />Luksussegmentet</SelectItem>
                    <SelectItem value={MarketTheme.TRENDS}><TrendingUp className="inline-block w-4 h-4 mr-2" />Trender & prognoser</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Merkevare</label>
            <Select value={selectedBrandId} onValueChange={setSelectedBrandId} disabled={brands.length === 0}>
              <SelectTrigger className="w-full bg-slate-900 border-slate-700 rounded-md text-sm text-slate-200 focus:border-cyan-500">
                <SelectValue placeholder="Velg merkevare..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-slate-200 border-slate-700">
                {brands.map(brand => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isLoading} className="w-full font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Generer Analyse
        </Button>
      </Card>
      
      {error && <div className="text-red-400 text-sm bg-red-950/50 p-4 rounded-md">{error}</div>}

      {analysis && (
        <Card className="p-4 lg:p-6 mt-6 border-slate-800 bg-slate-950/40 shadow-inner-lg animate-in fade-in duration-500">
            <article className="prose prose-invert prose-sm lg:prose-base max-w-none prose-headings:text-cyan-400 prose-headings:font-bold prose-strong:text-slate-100 prose-a:text-cyan-400 hover:prose-a:text-cyan-300">
                <ReactMarkdown>{analysis.text}</ReactMarkdown>
            </article>
            <footer className="mt-6 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-slate-400 mb-2">Datakilder (simulert)</h3>
                <div className="flex flex-wrap gap-2">
                    {analysis.sources.map((source, i) => (
                        <Badge key={i} variant="secondary" className="border border-slate-700">
                           <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                                {source.title}
                           </a>
                        </Badge>
                    ))}
                </div>
            </footer>
        </Card>
      )}
    </div>
  );
};

export default MarketPulse;
