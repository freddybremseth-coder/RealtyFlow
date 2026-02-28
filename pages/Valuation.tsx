
import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardList, User, MapPin, Home, Ruler, Wrench, Star, TrendingUp,
  Plus, Trash2, Loader2, Printer, X, ChevronDown, ChevronUp, ExternalLink,
  Save, FileText, CheckCircle, Phone, Mail, Globe, Zap, Building2,
  BedDouble, Bath, Car, Sun, Eye, Thermometer, Leaf, BarChart3, Award,
  AlertCircle, Search, RefreshCw, ArrowRight, Clock, Euro
} from 'lucide-react';
import { gemini } from '../services/geminiService';
import { valuationStore } from '../services/valuationService';
import { settingsStore } from '../services/settingsService';
import {
  PropertyValuationData, ValuationResult, SavedValuation,
  PropertyType, PropertyCondition, PropertyOrientation, PropertyView,
  EnergyRating, PoolType, ComparableProperty, Brand, AdvisorProfile
} from '../types';

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────

const EMPTY_FORM: PropertyValuationData = {
  ownerName: '', ownerPhone: '', ownerEmail: '', viewingDate: new Date().toISOString().split('T')[0],
  streetAddress: '', postalCode: '', municipality: '', province: 'Alicante', urbanization: '',
  propertyType: 'Villa', condition: 'Godt vedlikehold', yearBuilt: '', lastRenovated: '', energyRating: 'Ukjent',
  builtArea: 0, usefulArea: undefined, plotSize: undefined, terraceSize: undefined, floor: '', totalFloors: '',
  bedrooms: 3, bathrooms: 2, extraRooms: '',
  pool: 'Ingen', garage: false, parkingSpaces: 0, hasLift: false, hasAirConditioning: true,
  hasSolarPanels: false, hasStorageRoom: false, hasCommunityFees: false, communityFees: undefined, propertyTax: undefined,
  orientation: 'Sør', view: 'Ingen spesiell',
  ownerAskingPrice: undefined, avgPricePerSqmArea: undefined, comparables: [],
  agentNotes: '', agentStrengths: '', agentWeaknesses: ''
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat('nb-NO').format(n);

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> =
  ({ title, icon, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <button onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400">{icon}</span>
            <span className="font-semibold text-slate-100">{title}</span>
          </div>
          {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </button>
        {open && <div className="px-6 pb-6">{children}</div>}
      </div>
    );
  };

const Field: React.FC<{ label: string; children: React.ReactNode; col?: boolean }> =
  ({ label, children, col = false }) => (
    <div className={col ? 'flex flex-col gap-1' : 'flex flex-col gap-1'}>
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-600";
const selectCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all";
const toggleCls = (on: boolean) =>
  `relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${on ? 'bg-cyan-500' : 'bg-slate-700'}`;

// ─── PRINT REPORT ─────────────────────────────────────────────────────────────

const PrintReport: React.FC<{
  data: PropertyValuationData; result: ValuationResult;
  brand: Brand; profile: AdvisorProfile; onClose: () => void;
}> = ({ data, result, brand, profile, onClose }) => {

  const primaryColor = brand.visualStyles?.primaryColor || '#06b6d4';
  const dateStr = new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
  const range = result.estimatedHigh - result.estimatedLow;
  const midPct = range > 0 ? Math.round(((result.estimatedMid - result.estimatedLow) / range) * 100) : 50;

  // Decide owner price verdict
  const ownerVerdict = data.ownerAskingPrice
    ? data.ownerAskingPrice > result.estimatedHigh
      ? { cls: 'bg-red-50 border-red-200 text-red-700', label: `Eiers prisønske (${fmt(data.ownerAskingPrice)}) er over vår markedsverdi. Vi anbefaler en realistisk prisstrategi for raskest mulig salg.` }
      : data.ownerAskingPrice >= result.estimatedLow
      ? { cls: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: `Eiers prisønske (${fmt(data.ownerAskingPrice)}) er innenfor markedsintervallet. God posisjon for salg.` }
      : { cls: 'bg-amber-50 border-amber-200 text-amber-700', label: `Eiers prisønske (${fmt(data.ownerAskingPrice)}) er under vårt laveste estimat – det finnes rom for høyere pris.` }
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 overflow-auto">

      {/* ── Toolbar (skjult ved utskrift) ── */}
      <div className="print:hidden sticky top-0 z-10 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 py-3 shadow-xl">
        <div className="flex items-center gap-3">
          {brand.logo
            ? <img src={brand.logo} className="h-8 object-contain" alt={brand.name} />
            : <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: primaryColor }}><Zap size={16} className="text-white" /></div>}
          <span className="text-slate-200 font-semibold text-sm">{data.streetAddress}, {data.municipality}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
            style={{ background: primaryColor }}>
            <Printer size={15} /> Last ned PDF
          </button>
          <button onClick={onClose}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-xl text-sm transition-colors">
            <X size={15} /> Lukk
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DOKUMENT
      ══════════════════════════════════════════════════════════ */}
      <div className="max-w-[860px] mx-auto my-6 print:my-0 bg-white shadow-2xl print:shadow-none">

        {/* ── FORSIDETOPP ── */}
        <div className="h-3 w-full print:h-2" style={{ background: primaryColor }} />

        {/* ── TOPPHODE ── */}
        <div className="px-12 pt-10 pb-8 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center gap-4">
            {brand.logo
              ? <img src={brand.logo} className="h-14 object-contain" alt={brand.name} />
              : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl" style={{ background: primaryColor }}>{brand.name[0]}</div>}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{brand.name}</h1>
              <p className="text-xs text-slate-400 uppercase tracking-widest">{brand.type} · Eiendomsrådgiver</p>
              <p className="text-xs text-slate-500 mt-0.5">{brand.website} · {brand.email}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-2" style={{ background: primaryColor }}>
              Verdivurdering
            </div>
            <p className="text-xs text-slate-400">{dateStr}</p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{data.streetAddress}</p>
            <p className="text-xs text-slate-500">{data.postalCode} {data.municipality}, {data.province}</p>
            {data.urbanization && <p className="text-xs text-slate-400">{data.urbanization}</p>}
          </div>
        </div>

        {/* ── VELKOMSTBREV ── */}
        <div className="px-12 py-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: primaryColor }} />
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Kjære {data.ownerName || 'selger'}</h2>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-sm leading-7 text-slate-700 whitespace-pre-line italic font-serif">
            {result.thankYouLetter}
          </div>
        </div>

        {/* ── OM EIENDOMMEN ── */}
        <div className="px-12 py-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full" style={{ background: primaryColor }} />
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Om eiendommen</h2>
          </div>

          {/* Faktagrid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-0 mb-5 text-sm">
            {[
              ['Type', data.propertyType],
              ['Byggeår', data.yearBuilt || 'Ukjent'],
              ['Boareal', `${data.builtArea} m²`],
              ['Tilstand', data.condition],
              data.usefulArea ? ['Nyttig areal', `${data.usefulArea} m²`] : null,
              ['Energikarakter', data.energyRating],
              data.plotSize ? ['Tomtestørrelse', `${fmtNum(data.plotSize)} m²`] : null,
              ['Orientering', data.orientation],
              data.terraceSize ? ['Terrasse', `${data.terraceSize} m²`] : null,
              ['Utsikt', data.view],
              ['Soverom / baderom', `${data.bedrooms} / ${data.bathrooms}`],
              ['Basseng', data.pool],
              data.garage ? ['Garasje', `Ja (${data.parkingSpaces} plass)`] : ['Garasje', 'Nei'],
              data.hasCommunityFees && data.communityFees ? ['Felleskostnader', `€${data.communityFees}/mnd`] : null,
              data.propertyTax ? ['IBI (eiendomsskatt)', `€${data.propertyTax}/år`] : null,
            ].filter(Boolean).map(([k, v], i) => (
              <div key={i} className={`flex justify-between py-1.5 ${i % 2 === 0 ? '' : ''} border-b border-slate-100`}>
                <span className="text-slate-500 font-medium">{k}</span>
                <span className="text-slate-800 font-semibold">{v}</span>
              </div>
            ))}
          </div>

          {/* Fasiliteter-badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            {data.hasAirConditioning && <span className="px-3 py-1 text-xs rounded-full border font-medium" style={{ color: primaryColor, borderColor: primaryColor, background: `${primaryColor}12` }}>❄️ Klimaanlegg</span>}
            {data.hasSolarPanels && <span className="px-3 py-1 text-xs rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50 font-medium">☀️ Solcellepaneler</span>}
            {data.hasLift && <span className="px-3 py-1 text-xs rounded-full border border-purple-300 text-purple-700 bg-purple-50 font-medium">🔼 Heis</span>}
            {data.hasStorageRoom && <span className="px-3 py-1 text-xs rounded-full border border-amber-300 text-amber-700 bg-amber-50 font-medium">📦 Bodrom</span>}
            {data.hasSolarPanels && <span className="px-3 py-1 text-xs rounded-full border border-green-300 text-green-700 bg-green-50 font-medium">🌱 Energieffektiv</span>}
          </div>

          {/* Beskrivelse */}
          <p className="text-sm leading-7 text-slate-700 font-serif whitespace-pre-line">{result.propertyDescription}</p>
        </div>

        {/* ── VERDIVURDERING ── */}
        <div className="px-12 py-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-5 rounded-full" style={{ background: primaryColor }} />
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Verdivurdering</h2>
          </div>

          {/* Prisintervall-bjelke */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Lavt estimat</span>
              <span>Vår vurdering</span>
              <span>Høyt estimat</span>
            </div>
            <div className="relative h-10 bg-slate-100 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 right-0 rounded-full opacity-20" style={{ background: primaryColor }} />
              {/* Midtpunkt-markør */}
              <div className="absolute top-0 bottom-0 w-1 rounded-full -translate-x-1/2" style={{ left: `${midPct}%`, background: primaryColor }} />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full shadow" style={{ left: `${midPct}%`, background: primaryColor }}>
                {fmt(result.estimatedMid)}
              </div>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-600 mt-1">
              <span>{fmt(result.estimatedLow)}</span>
              <span>{fmt(result.estimatedHigh)}</span>
            </div>
          </div>

          {/* Nøkkeltall */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="rounded-2xl border border-slate-200 p-5 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Anbefalt utleggspris</p>
              <p className="text-2xl font-bold" style={{ color: primaryColor }}>{fmt(result.recommendedListingPrice)}</p>
              <p className="text-[10px] text-slate-400 mt-1">inkl. 4–6% forhandlingsmargin</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Vurdert kvm-pris</p>
              <p className="text-2xl font-bold text-slate-800">{fmtNum(result.pricePerSqm)} €/m²</p>
              <p className="text-[10px] text-slate-400 mt-1">{data.builtArea} m² boareal</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Prisintervall</p>
              <p className="text-lg font-bold text-slate-700">{fmt(result.estimatedLow)}</p>
              <p className="text-xs text-slate-400">–</p>
              <p className="text-lg font-bold text-slate-700">{fmt(result.estimatedHigh)}</p>
            </div>
          </div>

          {/* Eiers prisønske-vurdering */}
          {ownerVerdict && (
            <div className={`rounded-xl border p-4 text-sm ${ownerVerdict.cls}`}>
              {ownerVerdict.label}
            </div>
          )}

          {/* Markedsposisjonering */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Markedsposisjonering</p>
            <p className="text-sm text-slate-700 italic">{result.marketPositioning}</p>
          </div>
        </div>

        {/* ── SAMMENLIGNBARE ── */}
        {data.comparables.length > 0 && (
          <div className="px-12 py-8 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background: primaryColor }} />
              <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Sammenlignbare eiendommer</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: `${primaryColor}15` }}>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-700">Eiendom</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-slate-700">Pris</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-slate-700">Areal</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-slate-700">€/m²</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-slate-700">Sov.</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-slate-700">Kilde</th>
                </tr>
              </thead>
              <tbody>
                {data.comparables.map((c, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{c.title}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{fmt(c.price)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{c.area} m²</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{fmtNum(c.pricePerSqm)}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{c.bedrooms}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        c.source === 'CasaSafari'
                          ? 'bg-emerald-100 text-emerald-700'
                          : c.source === 'Idealista'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>{c.source}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-400 mt-2">* CasaSafari = faktisk transaksjonspris · Idealista = prisantydning</p>
          </div>
        )}

        {/* ── MARKEDSANALYSE ── */}
        <div className="px-12 py-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full" style={{ background: primaryColor }} />
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Markedsanalyse – {data.municipality}</h2>
          </div>
          <p className="text-sm leading-7 text-slate-700 font-serif whitespace-pre-line">{result.marketAnalysis}</p>
        </div>

        {/* ── SALGSSTRATEGI ── */}
        <div className="px-12 py-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full" style={{ background: primaryColor }} />
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Vår salgsstrategi</h2>
          </div>
          <p className="text-sm leading-7 text-slate-700 font-serif whitespace-pre-line mb-5">{result.salesStrategy}</p>
        </div>

        {/* ── OM BYRÅET ── */}
        <div className="px-12 py-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full" style={{ background: primaryColor }} />
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Om {brand.name}</h2>
          </div>
          <p className="text-sm leading-7 text-slate-600 mb-5">
            {brand.name} er et norskeid eiendomsmeglerfirma med base i Spania, spesialisert på å hjelpe skandinaver og europeere med å kjøpe og selge bolig på Costa Blanca og Costa Calida. Vi snakker ditt språk – bokstavelig talt.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              'Profesjonell fotografering, video & 3D-tur',
              'Annonsering på 8+ internasjonale portaler',
              'Idealista · Fotocasa · Kyero · Rightmove',
              'Sosiale medier på 6 språk',
              'Direkte til 10 000+ nordiske kjøpere',
              'Juridisk koordinering og NIE-assistanse',
              'Alltid tilgjengelig rådgiver – ingen mellommenn',
              'Ingen salg = ingen betaling',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle size={13} style={{ color: primaryColor }} className="shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* ── KOMMISJON ── */}
        <div className="px-12 py-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full" style={{ background: primaryColor }} />
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Kommisjon og tilbud</h2>
          </div>
          <div className="rounded-2xl border p-6 grid grid-cols-2 gap-6" style={{ borderColor: `${primaryColor}40`, background: `${primaryColor}06` }}>
            <div>
              <p className="text-5xl font-black mb-1" style={{ color: primaryColor }}>3,5%</p>
              <p className="text-sm text-slate-500">av endelig salgspris inkl. IVA</p>
              <p className="text-xs text-slate-400 mt-1">Eksklusivt salgsoppdrag · 3–6 måneder</p>
            </div>
            <div className="space-y-3">
              {[
                ['Ingen salg = ingen betaling', 'Vi tar risikoen sammen med deg.'],
                ['Ingen oppstartskostnad', 'Alt arbeid utføres på forhånd.'],
                ['Internasjonalt kjøpernettverk', 'Tilgang til 10 000+ aktive kjøpere.'],
                ['Juridisk trygghet', 'Vi koordinerer advokat og gestor.'],
              ].map(([t, d], i) => (
                <div key={i} className="flex gap-2">
                  <CheckCircle size={14} style={{ color: primaryColor }} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{t}</p>
                    <p className="text-xs text-slate-500">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── NESTE STEG ── */}
        <div className="px-12 py-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full" style={{ background: primaryColor }} />
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Neste steg</h2>
          </div>
          <div className="space-y-4">
            {[
              ['Salgskontrakt', 'Vi sender deg et eksklusivt salgsoppdrag for gjennomgang og signering.'],
              ['Foto & 3D-tur', 'Profesjonell fotograf og 3D-fotograf bestilles innen 48 timer.'],
              ['Internasjonal annonsering', 'Eiendommen annonseres på 8+ portaler innen 5 virkedager.'],
              ['Løpende oppfølging', 'Du mottar jevnlige statusrapporter og tilbakemeldinger fra visninger.'],
            ].map(([t, d], i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center shrink-0" style={{ background: primaryColor }}>
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t}</p>
                  <p className="text-sm text-slate-500">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RÅDGIVER-FOOTER ── */}
        <div className="px-12 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor: primaryColor }}>
              {profile.imageUrl
                ? <img src={profile.imageUrl} className="w-full h-full object-cover" alt={profile.name} />
                : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold" style={{ background: primaryColor }}>{profile.name[0]}</div>}
            </div>
            <div>
              <p className="font-bold text-slate-900">{profile.name}</p>
              <p className="text-xs text-slate-500">Senior Eiendomsrådgiver · {brand.name}</p>
              {profile.signature && (
                <p className="text-xs text-slate-400 mt-1 italic">{profile.signature.split('\n')[0]}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-1.5">
                {profile.phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone size={10} style={{ color: primaryColor }} />{profile.phone}</span>}
                {profile.phone2 && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone size={10} style={{ color: primaryColor }} />{profile.phone2}</span>}
                {brand.email && <span className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10} style={{ color: primaryColor }} />{brand.email}</span>}
                {brand.website && <span className="text-xs text-slate-500 flex items-center gap-1"><Globe size={10} style={{ color: primaryColor }} />{brand.website}</span>}
              </div>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400 max-w-[200px]">
            <p className="font-semibold text-slate-500 mb-1">Utstedt: {dateStr}</p>
            <p>Basert på markedsdata (Idealista + CasaSafari) og rådgiverens faglige skjønn. Ikke juridisk bindende.</p>
          </div>
        </div>

        {/* ── BUNNLINJE ── */}
        <div className="h-2 w-full" style={{ background: primaryColor }} />
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:my-0 { margin-top: 0 !important; margin-bottom: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          @page { margin: 0; size: A4; }
        }
      `}</style>
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

const Valuation: React.FC = () => {
  const [form, setForm] = useState<PropertyValuationData>({ ...EMPTY_FORM });
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [savedList, setSavedList] = useState<SavedValuation[]>(valuationStore.getAll());
  const [showHistory, setShowHistory] = useState(false);
  const [activeBrand, setActiveBrand] = useState<Brand>(settingsStore.getBrands()[0]);
  const [profile, setProfile] = useState<AdvisorProfile>(settingsStore.getProfile());
  const [newComp, setNewComp] = useState<Partial<ComparableProperty>>({ source: 'Manuell' });

  useEffect(() => {
    const unsub = settingsStore.subscribe(() => {
      setActiveBrand(settingsStore.getBrands()[0]);
      setProfile(settingsStore.getProfile());
    });
    const unsubV = valuationStore.subscribe(() => setSavedList(valuationStore.getAll()));
    return () => { unsub(); unsubV(); };
  }, []);

  const set = <K extends keyof PropertyValuationData>(key: K, val: PropertyValuationData[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const addComparable = () => {
    if (!newComp.title || !newComp.price || !newComp.area) return;
    const price = newComp.price!;
    const area = newComp.area!;
    const comp: ComparableProperty = {
      title: newComp.title!, price, area,
      pricePerSqm: Math.round(price / area),
      bedrooms: newComp.bedrooms || 0,
      source: newComp.source as ComparableProperty['source'] || 'Manuell',
      url: newComp.url,
      location: newComp.location
    };
    set('comparables', [...form.comparables, comp]);
    setNewComp({ source: 'Manuell' });
  };

  const removeComparable = (i: number) =>
    set('comparables', form.comparables.filter((_, idx) => idx !== i));

  const handleGenerate = async () => {
    if (!form.streetAddress || !form.municipality || !form.builtArea) {
      setError('Fyll inn adresse, kommune og boareal som minimum.');
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const r = await gemini.generatePropertyValuation(form, activeBrand.id, profile);
      setResult(r);
      // Auto-save
      const saved: SavedValuation = {
        id: `val_${Date.now()}`,
        createdAt: new Date().toISOString(),
        brandId: activeBrand.id,
        propertyData: { ...form },
        result: r
      };
      valuationStore.save(saved);
      // Scroll to result
      setTimeout(() => document.getElementById('valuation-result')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      setError(e.message || 'Noe gikk galt. Sjekk API-nøkkel og prøv igjen.');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadSaved = (v: SavedValuation) => {
    setForm(v.propertyData);
    setResult(v.result);
    setShowHistory(false);
    setTimeout(() => document.getElementById('valuation-result')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const idealista_url = `https://www.idealista.com/venta-viviendas/${form.municipality.toLowerCase().replace(/\s+/g, '-')}-${form.province.toLowerCase().replace(/\s+/g, '-')}/`;
  const casasafari_url = `https://casasafari.com/es/valoracion?address=${encodeURIComponent([form.streetAddress, form.municipality, form.province].filter(Boolean).join(', '))}`;

  // ── render ──
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 lg:py-10 space-y-6">

      {showReport && result && (
        <PrintReport
          data={form} result={result}
          brand={activeBrand} profile={profile}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* ─ Header ─ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <ClipboardList size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Verdivurdering</h1>
              <p className="text-sm text-slate-500">AI-generert profesjonell markedsvurdering for selgere</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm transition-colors">
            <Clock size={15} />
            <span className="hidden sm:inline">Historikk</span>
            {savedList.length > 0 && <span className="bg-cyan-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{savedList.length}</span>}
          </button>
          {result && (
            <button onClick={() => setShowReport(true)}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              <Printer size={15} /> Åpne rapport
            </button>
          )}
        </div>
      </div>

      {/* ─ History panel ─ */}
      {showHistory && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2"><Clock size={16} className="text-cyan-400" /> Lagrede vurderinger</h3>
          {savedList.length === 0 ? (
            <p className="text-slate-500 text-sm">Ingen lagrede vurderinger ennå.</p>
          ) : (
            <div className="space-y-2">
              {savedList.map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl hover:bg-slate-750 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{v.propertyData.streetAddress}</p>
                    <p className="text-xs text-slate-500">{v.propertyData.municipality} · {new Date(v.createdAt).toLocaleDateString('nb-NO')} · {fmt(v.result.estimatedMid)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadSaved(v)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Last inn</button>
                    <button onClick={() => valuationStore.delete(v.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors">Slett</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─ Brand selector ─ */}
      <div className="flex gap-3 flex-wrap">
        {settingsStore.getBrands().map(b => (
          <button key={b.id} onClick={() => setActiveBrand(b)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${activeBrand.id === b.id
              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
            {b.name}
          </button>
        ))}
      </div>

      {/* ══════════════════ FORM SECTIONS ══════════════════ */}

      {/* 1. Eier og visning */}
      <SectionCard title="Eier og visning" icon={<User size={18} />}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Eierens navn">
            <input className={inputCls} value={form.ownerName} onChange={e => set('ownerName', e.target.value)} placeholder="Fornavn Etternavn" />
          </Field>
          <Field label="Telefon">
            <input className={inputCls} value={form.ownerPhone} onChange={e => set('ownerPhone', e.target.value)} placeholder="+34 600..." />
          </Field>
          <Field label="E-post">
            <input className={inputCls} type="email" value={form.ownerEmail} onChange={e => set('ownerEmail', e.target.value)} placeholder="eier@email.com" />
          </Field>
          <Field label="Visningsdato">
            <input className={inputCls} type="date" value={form.viewingDate} onChange={e => set('viewingDate', e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      {/* 2. Adresse */}
      <SectionCard title="Adresse" icon={<MapPin size={18} />}>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Gateadresse *">
            <input className={inputCls} value={form.streetAddress} onChange={e => set('streetAddress', e.target.value)} placeholder="Calle Mayor 12" />
          </Field>
          <Field label="Urbanisering / boligfelt">
            <input className={inputCls} value={form.urbanization || ''} onChange={e => set('urbanization', e.target.value)} placeholder="Urb. Las Palmeras" />
          </Field>
          <Field label="Postnummer">
            <input className={inputCls} value={form.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="03001" />
          </Field>
          <Field label="Kommune / By *">
            <input className={inputCls} value={form.municipality} onChange={e => set('municipality', e.target.value)} placeholder="Benidorm" />
          </Field>
          <Field label="Provins">
            <select className={selectCls} value={form.province} onChange={e => set('province', e.target.value)}>
              {['Alicante', 'Murcia', 'Valencia', 'Malaga', 'Almeria', 'Annet'].map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>
      </SectionCard>

      {/* 3. Type og tilstand */}
      <SectionCard title="Type og tilstand" icon={<Home size={18} />}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Boligtype *">
            <select className={selectCls} value={form.propertyType} onChange={e => set('propertyType', e.target.value as PropertyType)}>
              {(['Villa', 'Leilighet', 'Rekkehus', 'Finca', 'Duplex', 'Bungalow', 'Tomt', 'Annet'] as PropertyType[]).map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Tilstand">
            <select className={selectCls} value={form.condition} onChange={e => set('condition', e.target.value as PropertyCondition)}>
              {(['Nytt / Aldri bebodd', 'Som nytt / Renovert', 'Godt vedlikehold', 'Trenger noe arbeid', 'Trenger totalrenovering'] as PropertyCondition[]).map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Byggeår">
            <input className={inputCls} value={form.yearBuilt} onChange={e => set('yearBuilt', e.target.value)} placeholder="1995" />
          </Field>
          <Field label="Sist renovert">
            <input className={inputCls} value={form.lastRenovated || ''} onChange={e => set('lastRenovated', e.target.value)} placeholder="2018" />
          </Field>
          <Field label="Energikarakter">
            <select className={selectCls} value={form.energyRating} onChange={e => set('energyRating', e.target.value as EnergyRating)}>
              {(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Ukjent'] as EnergyRating[]).map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>
        </div>
      </SectionCard>

      {/* 4. Størrelser og rom */}
      <SectionCard title="Størrelser og rom" icon={<Ruler size={18} />}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Field label="Boareal (m²) *">
            <input className={inputCls} type="number" value={form.builtArea || ''} onChange={e => set('builtArea', +e.target.value)} placeholder="120" />
          </Field>
          <Field label="Nyttig areal (m²)">
            <input className={inputCls} type="number" value={form.usefulArea || ''} onChange={e => set('usefulArea', +e.target.value || undefined)} placeholder="105" />
          </Field>
          <Field label="Tomtestørrelse (m²)">
            <input className={inputCls} type="number" value={form.plotSize || ''} onChange={e => set('plotSize', +e.target.value || undefined)} placeholder="500" />
          </Field>
          <Field label="Terrasse / balkong (m²)">
            <input className={inputCls} type="number" value={form.terraceSize || ''} onChange={e => set('terraceSize', +e.target.value || undefined)} placeholder="30" />
          </Field>
          <Field label="Soverom">
            <input className={inputCls} type="number" min={0} max={20} value={form.bedrooms} onChange={e => set('bedrooms', +e.target.value)} />
          </Field>
          <Field label="Baderom">
            <input className={inputCls} type="number" min={0} max={20} value={form.bathrooms} onChange={e => set('bathrooms', +e.target.value)} />
          </Field>
          <Field label="Etasje">
            <input className={inputCls} value={form.floor || ''} onChange={e => set('floor', e.target.value)} placeholder="2" />
          </Field>
          <Field label="Totalt etasjer">
            <input className={inputCls} value={form.totalFloors || ''} onChange={e => set('totalFloors', e.target.value)} placeholder="5" />
          </Field>
        </div>
        <Field label="Ekstra rom (beskrivelse)">
          <input className={inputCls} value={form.extraRooms || ''} onChange={e => set('extraRooms', e.target.value)} placeholder="Studie, vaskerom, vinkjeller..." />
        </Field>
      </SectionCard>

      {/* 5. Fasiliteter */}
      <SectionCard title="Fasiliteter" icon={<Star size={18} />}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <Field label="Basseng">
            <select className={selectCls} value={form.pool} onChange={e => set('pool', e.target.value as PoolType)}>
              {(['Ingen', 'Privat', 'Fellesareal'] as PoolType[]).map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Parkeringsplasser">
            <input className={inputCls} type="number" min={0} value={form.parkingSpaces} onChange={e => { set('parkingSpaces', +e.target.value); set('garage', +e.target.value > 0); }} placeholder="0" />
          </Field>
          <Field label="Felleskostnader (€/mnd)">
            <input className={inputCls} type="number" value={form.communityFees || ''} onChange={e => { set('communityFees', +e.target.value || undefined); set('hasCommunityFees', +e.target.value > 0); }} placeholder="80" />
          </Field>
          <Field label="IBI – Eiendomsskatt (€/år)">
            <input className={inputCls} type="number" value={form.propertyTax || ''} onChange={e => set('propertyTax', +e.target.value || undefined)} placeholder="400" />
          </Field>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ['Klimaanlegg', 'hasAirConditioning'],
            ['Heis', 'hasLift'],
            ['Solcellepaneler', 'hasSolarPanels'],
            ['Bodrom', 'hasStorageRoom'],
          ] as [string, keyof PropertyValuationData][]).map(([label, key]) => (
            <label key={key} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-750 transition-colors">
              <span className="text-sm text-slate-300">{label}</span>
              <button type="button" onClick={() => set(key, !form[key] as any)} className={toggleCls(!!form[key])}>
                <span className={`inline-block w-4 h-4 bg-white rounded-full transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </label>
          ))}
        </div>
      </SectionCard>

      {/* 6. Orientering og utsikt */}
      <SectionCard title="Orientering og utsikt" icon={<Sun size={18} />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Orientering">
            <select className={selectCls} value={form.orientation} onChange={e => set('orientation', e.target.value as PropertyOrientation)}>
              {(['Sør', 'Sør-Vest', 'Sør-Øst', 'Vest', 'Øst', 'Nord', 'Nord-Vest', 'Nord-Øst'] as PropertyOrientation[]).map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Utsikt">
            <select className={selectCls} value={form.view} onChange={e => set('view', e.target.value as PropertyView)}>
              {(['Havutsikt', 'Fjellutsikt', 'Byutsikt', 'Basseng/hage', 'Indre gård', 'Ingen spesiell'] as PropertyView[]).map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
        </div>
      </SectionCard>

      {/* 7. Markedsdata */}
      <SectionCard title="Markedsdata" icon={<TrendingUp size={18} />}>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <Field label="Eiers prisønske (€)">
            <input className={inputCls} type="number" value={form.ownerAskingPrice || ''} onChange={e => set('ownerAskingPrice', +e.target.value || undefined)} placeholder="250000" />
          </Field>
          <Field label="Gj.snitt kvm-pris i området (€/m²)">
            <input className={inputCls} type="number" value={form.avgPricePerSqmArea || ''} onChange={e => set('avgPricePerSqmArea', +e.target.value || undefined)} placeholder="1850" />
          </Field>
        </div>

        {/* External links */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <a href={idealista_url} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-cyan-500/40 transition-colors group">
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Search size={15} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200">Idealista</p>
              <p className="text-xs text-slate-500 truncate">Søk sammenlignbare eiendommer</p>
            </div>
            <ExternalLink size={13} className="text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
          </a>
          <a href={casasafari_url} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-cyan-500/40 transition-colors group">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <BarChart3 size={15} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200">CasaSafari</p>
              <p className="text-xs text-slate-500 truncate">Automatisk verdivurdering</p>
            </div>
            <ExternalLink size={13} className="text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
          </a>
        </div>

        {/* Comparables */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sammenlignbare eiendommer</p>
          {form.comparables.length > 0 && (
            <div className="space-y-2 mb-3">
              {form.comparables.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-medium truncate">{c.title}</p>
                    <p className="text-slate-500 text-xs">{fmt(c.price)} · {c.area}m² · {fmtNum(c.pricePerSqm)} €/m² · {c.bedrooms} sov. · {c.source}</p>
                  </div>
                  <button onClick={() => removeComparable(i)} className="ml-3 text-red-400 hover:text-red-300 transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
            <input className={`${inputCls} lg:col-span-2`} value={newComp.title || ''} onChange={e => setNewComp(c => ({ ...c, title: e.target.value }))} placeholder="Navn / adresse" />
            <input className={inputCls} type="number" value={newComp.price || ''} onChange={e => setNewComp(c => ({ ...c, price: +e.target.value }))} placeholder="Pris €" />
            <input className={inputCls} type="number" value={newComp.area || ''} onChange={e => setNewComp(c => ({ ...c, area: +e.target.value }))} placeholder="m²" />
            <input className={inputCls} type="number" value={newComp.bedrooms || ''} onChange={e => setNewComp(c => ({ ...c, bedrooms: +e.target.value }))} placeholder="Sov." />
            <div className="flex gap-2">
              <select className={`${selectCls} flex-1`} value={newComp.source || 'Manuell'} onChange={e => setNewComp(c => ({ ...c, source: e.target.value as any }))}>
                <option>Idealista</option>
                <option>CasaSafari</option>
                <option>Manuell</option>
              </select>
              <button onClick={addComparable}
                className="bg-cyan-500 hover:bg-cyan-400 text-white px-3 rounded-xl transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 8. Rådgivernotater */}
      <SectionCard title="Rådgiverens notater fra visning" icon={<ClipboardList size={18} />}>
        <div className="space-y-4">
          <Field label="Generelle notater / inntrykk">
            <textarea className={`${inputCls} resize-none`} rows={4}
              value={form.agentNotes}
              onChange={e => set('agentNotes', e.target.value)}
              placeholder="Skriv fritt om eiendommen, nabolaget, eiers situasjon, stemning på visning, vedlikehold, spesielle trekk..." />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Styrker (selgspunkter)">
              <textarea className={`${inputCls} resize-none`} rows={3}
                value={form.agentStrengths}
                onChange={e => set('agentStrengths', e.target.value)}
                placeholder="Flott utsikt, stor terrasse, topprenovert kjøkken, rolig beliggenhet, sydvendt..." />
            </Field>
            <Field label="Svakheter (utfordringer)">
              <textarea className={`${inputCls} resize-none`} rows={3}
                value={form.agentWeaknesses}
                onChange={e => set('agentWeaknesses', e.target.value)}
                placeholder="Trafikkstøy, utdatert bad, ingen heis, nord-vendt, lite vedlikehold..." />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* ─ Error ─ */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* ─ Generate button ─ */}
      <button onClick={handleGenerate} disabled={isGenerating}
        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg shadow-cyan-500/20">
        {isGenerating ? (
          <><Loader2 size={20} className="animate-spin" /> AI genererer profesjonell verdivurdering...</>
        ) : (
          <><Zap size={20} /> Generer AI-verdivurdering</>
        )}
      </button>

      {/* ══════════════════ RESULT ══════════════════ */}

      {result && (
        <div id="valuation-result" className="space-y-5 pt-2">

          {/* Headline numbers */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle size={20} className="text-cyan-400" /> Verdivurdering generert
              </h2>
              <button onClick={() => setShowReport(true)}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-cyan-500/20">
                <Printer size={15} /> Åpne fullstendig rapport
              </button>
            </div>

            {/* Value range */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-4 bg-slate-800 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Lavt</p>
                <p className="text-xl font-bold text-slate-300">{fmt(result.estimatedLow)}</p>
              </div>
              <div className="text-center p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1">Vår vurdering</p>
                <p className="text-2xl font-bold text-cyan-300">{fmt(result.estimatedMid)}</p>
              </div>
              <div className="text-center p-4 bg-slate-800 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Høyt</p>
                <p className="text-xl font-bold text-slate-300">{fmt(result.estimatedHigh)}</p>
              </div>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-800/60 rounded-xl flex items-center gap-3">
                <Euro size={16} className="text-amber-400" />
                <div>
                  <p className="text-xs text-slate-500">Anbefalt utleggspris</p>
                  <p className="text-base font-bold text-amber-300">{fmt(result.recommendedListingPrice)}</p>
                </div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl flex items-center gap-3">
                <BarChart3 size={16} className="text-purple-400" />
                <div>
                  <p className="text-xs text-slate-500">Vurdert kvm-pris</p>
                  <p className="text-base font-bold text-purple-300">{fmtNum(result.pricePerSqm)} €/m²</p>
                </div>
              </div>
            </div>

            {/* Market positioning */}
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Markedsposisjonering</p>
              <p className="text-sm text-slate-300 italic">{result.marketPositioning}</p>
            </div>
          </div>

          {/* Report sections preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User size={14} /> Takkebrev
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-5">{result.thankYouLetter}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Home size={14} /> Eiendomsbeskrivelse
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-5">{result.propertyDescription}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp size={14} /> Markedsanalyse
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-5">{result.marketAnalysis}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Award size={14} /> Salgsstrategi
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-5">{result.salesStrategy}</p>
            </div>
          </div>

          <button onClick={() => setShowReport(true)}
            className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/30 text-slate-200 font-semibold py-4 rounded-2xl text-sm transition-all">
            <FileText size={18} className="text-cyan-400" /> Åpne fullstendig rapport (PDF-klar)
            <ArrowRight size={16} className="text-slate-500" />
          </button>
        </div>
      )}

    </div>
  );
};

export default Valuation;
