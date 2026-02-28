/**
 * ═══════════════════════════════════════════════════════════════
 *  RealtyFlow – Markedsdata for verdivurdering
 *  Kilde: Idealista Sala de Prensa + CasaSafari CMA
 * ═══════════════════════════════════════════════════════════════
 *
 *  MÅNEDLIG OPPDATERING:
 *  1. Gå til https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/
 *  2. Last ned den siste rapporten for Comunitat Valenciana og Murcia
 *  3. Oppdater tallene i AREA_MARKET_DATA nedenfor
 *  4. Oppdater MARKET_DATA_UPDATED til dagens dato
 *  5. Lagre filen – appen plukker opp endringene automatisk
 *
 *  Idealista publiserer vanligvis månedlige rapporter rundt den
 *  10.–15. i måneden for forrige måned.
 * ═══════════════════════════════════════════════════════════════
 */

export const MARKET_DATA_UPDATED = '2026-01-15'; // ← Oppdater denne hver måned
export const MARKET_DATA_SOURCE = 'Idealista Sala de Prensa + CasaSafari CMA';
export const CLOSING_TO_ASKING_RATIO = 0.955; // 95,5 % – selger får ~4,5% under prisantydning

// ─── Typer ────────────────────────────────────────────────────────────────────

export type MarketRegion =
  | 'Costa Blanca Nord'
  | 'Costa Blanca Sør'
  | 'Innland Alicante'
  | 'Costa Cálida Murcia'
  | 'Annet';

export type PriceTrend = 'sterkt stigende' | 'stigende' | 'stabilt' | 'synkende';

export interface AreaMarketData {
  municipality: string;           // Norsk/vanlig navn
  municipalityES: string;         // Spansk offisielt navn (for søk)
  province: string;
  region: MarketRegion;
  askingPricePerSqm: number;      // Idealista prisantydning €/m²
  transactionPricePerSqm: number; // Estimert faktisk salgspris €/m²
  yoyChangePct?: number;          // % endring siste 12 måneder
  trend: PriceTrend;
  avgDaysOnMarket?: number;       // Gjennomsnittlig tid på markedet
  notes?: string;                 // Ekstra kontekst
}

// ─── Alle områder ─────────────────────────────────────────────────────────────

export const AREA_MARKET_DATA: AreaMarketData[] = [

  // ═══ COSTA BLANCA NORD ═══════════════════════════════════════════════════════

  {
    municipality: 'Moraira',
    municipalityES: 'Moraira (Teulada)',
    province: 'Alicante',
    region: 'Costa Blanca Nord',
    askingPricePerSqm: 4040,
    transactionPricePerSqm: 3600,
    yoyChangePct: 12,
    trend: 'stigende',
    avgDaysOnMarket: 240,
    notes: 'Eksklusivt kystmarked, begrenset tilbud, høy internasjonal etterspørsel. Prisene steg ~47% på 5 år.'
  },
  {
    municipality: 'Calpe',
    municipalityES: 'Calpe / Calp',
    province: 'Alicante',
    region: 'Costa Blanca Nord',
    askingPricePerSqm: 3438,
    transactionPricePerSqm: 2471, // CasaSafari CMA Q4 2025 – Calpe Pueblo median
    yoyChangePct: 16,
    trend: 'sterkt stigende',
    avgDaysOnMarket: 276, // CasaSafari data
    notes: 'Closing-to-asking 95,5 %. Tid på marked: 11–17 mnd avh. av prissegment. Prisrange aktive annonser: €199k–€385k.'
  },
  {
    municipality: 'Jávea',
    municipalityES: 'Jávea / Xàbia',
    province: 'Alicante',
    region: 'Costa Blanca Nord',
    askingPricePerSqm: 3958,
    transactionPricePerSqm: 3550,
    yoyChangePct: 19.8,
    trend: 'sterkt stigende',
    avgDaysOnMarket: 210,
    notes: 'Høyest prisvekst i Alicante-provinsen 2025. Sterk internasjonal etterspørsel fra nordeuropeere.'
  },
  {
    municipality: 'Benitachell',
    municipalityES: 'Benitachell / Poble Nou de Benitatxell',
    province: 'Alicante',
    region: 'Costa Blanca Nord',
    askingPricePerSqm: 3335,
    transactionPricePerSqm: 3000,
    yoyChangePct: 11,
    trend: 'stigende',
    avgDaysOnMarket: 230,
  },
  {
    municipality: 'Denia',
    municipalityES: 'Dénia',
    province: 'Alicante',
    region: 'Costa Blanca Nord',
    askingPricePerSqm: 3217,
    transactionPricePerSqm: 2900,
    yoyChangePct: 14,
    trend: 'stigende',
    avgDaysOnMarket: 220,
    notes: 'Populær med tyske og britiske kjøpere.'
  },
  {
    municipality: 'Altea',
    municipalityES: 'Altea',
    province: 'Alicante',
    region: 'Costa Blanca Nord',
    askingPricePerSqm: 3415,
    transactionPricePerSqm: 3050,
    yoyChangePct: 13,
    trend: 'stigende',
    avgDaysOnMarket: 250,
    notes: 'Kunstnerbyen på Costa Blanca. Begrenset nybygg-tilbud driver prisene.'
  },
  {
    municipality: 'Albir',
    municipalityES: "L'Alfàs del Pi / Albir",
    province: 'Alicante',
    region: 'Costa Blanca Nord',
    askingPricePerSqm: 3000,
    transactionPricePerSqm: 2700,
    yoyChangePct: 10,
    trend: 'stigende',
    avgDaysOnMarket: 260,
  },
  {
    municipality: 'Benissa',
    municipalityES: 'Benissa',
    province: 'Alicante',
    region: 'Costa Blanca Nord',
    askingPricePerSqm: 2400,
    transactionPricePerSqm: 2100,
    yoyChangePct: 9,
    trend: 'stigende',
    avgDaysOnMarket: 280,
    notes: 'Mer rolig innlandskarakter. God valuta for pengene.'
  },
  {
    municipality: 'Benidorm',
    municipalityES: 'Benidorm',
    province: 'Alicante',
    region: 'Costa Blanca Nord',
    askingPricePerSqm: 3246,
    transactionPricePerSqm: 2800,
    yoyChangePct: 15,
    trend: 'sterkt stigende',
    avgDaysOnMarket: 200,
    notes: 'Stor variasjon mellom sonene. Playa de Poniente: 4.611 €/m² (dyreste). Centro Urbano: 2.645 €/m² (rimeligste). Sterk leieavkastning: 6–8 %.'
  },
  {
    municipality: 'La Vila Joiosa',
    municipalityES: 'La Vila Joiosa / Villajoyosa',
    province: 'Alicante',
    region: 'Costa Blanca Nord',
    askingPricePerSqm: 2600,
    transactionPricePerSqm: 2200,
    yoyChangePct: 11,
    trend: 'stigende',
    avgDaysOnMarket: 270,
    notes: 'Voksende marked. Attraktivt for førstegangskjøpere og investorer.'
  },
  {
    municipality: 'El Campello',
    municipalityES: 'El Campello',
    province: 'Alicante',
    region: 'Costa Blanca Nord',
    askingPricePerSqm: 2500,
    transactionPricePerSqm: 2200,
    yoyChangePct: 10,
    trend: 'stigende',
    avgDaysOnMarket: 260,
  },

  // ═══ COSTA BLANCA SØR ════════════════════════════════════════════════════════

  {
    municipality: 'Alicante by',
    municipalityES: 'Alicante / Alacant',
    province: 'Alicante',
    region: 'Costa Blanca Sør',
    askingPricePerSqm: 2499,
    transactionPricePerSqm: 2280,
    yoyChangePct: 11.2,
    trend: 'stigende',
    avgDaysOnMarket: 240,
    notes: 'Stor variasjon. Playa de San Juan (dyreste): 3.563 €/m². Sentrum rimeligst: ~1.067 €/m². Snitt leieavkastning: 5,59 % (3,69–6,95 %).'
  },
  {
    municipality: 'Playa de San Juan',
    municipalityES: 'Playa de San Juan (Alicante)',
    province: 'Alicante',
    region: 'Costa Blanca Sør',
    askingPricePerSqm: 3563,
    transactionPricePerSqm: 3200,
    yoyChangePct: 14,
    trend: 'sterkt stigende',
    avgDaysOnMarket: 200,
    notes: 'Dyreste sone i Alicante by. Sandstrand, høy internasjonal etterspørsel.'
  },
  {
    municipality: 'Mutxamel',
    municipalityES: 'Mutxamel',
    province: 'Alicante',
    region: 'Costa Blanca Sør',
    askingPricePerSqm: 1700,
    transactionPricePerSqm: 1500,
    yoyChangePct: 8,
    trend: 'stigende',
    avgDaysOnMarket: 300,
  },
  {
    municipality: 'Santa Pola',
    municipalityES: 'Santa Pola',
    province: 'Alicante',
    region: 'Costa Blanca Sør',
    askingPricePerSqm: 2200,
    transactionPricePerSqm: 1950,
    yoyChangePct: 16.5,
    trend: 'sterkt stigende',
    avgDaysOnMarket: 220,
    notes: 'En av de raskest voksende markedene i 2025. God strand og havn.'
  },
  {
    municipality: 'Elche',
    municipalityES: 'Elche / Elx',
    province: 'Alicante',
    region: 'Costa Blanca Sør',
    askingPricePerSqm: 1550,
    transactionPricePerSqm: 1380,
    yoyChangePct: 9,
    trend: 'stigende',
    avgDaysOnMarket: 280,
  },
  {
    municipality: 'Guardamar del Segura',
    municipalityES: 'Guardamar del Segura',
    province: 'Alicante',
    region: 'Costa Blanca Sør',
    askingPricePerSqm: 2100,
    transactionPricePerSqm: 1850,
    yoyChangePct: 13,
    trend: 'stigende',
    avgDaysOnMarket: 250,
    notes: 'Blå flagg-strender. Populært for pensjonister og nordiske kjøpere.'
  },
  {
    municipality: 'Torrevieja',
    municipalityES: 'Torrevieja',
    province: 'Alicante',
    region: 'Costa Blanca Sør',
    askingPricePerSqm: 2392,
    transactionPricePerSqm: 2100,
    yoyChangePct: 14.3,
    trend: 'sterkt stigende',
    avgDaysOnMarket: 230,
    notes: 'Svært populært med nordiske og russiske kjøpere. Mye nybygg. God leieavkastning.'
  },
  {
    municipality: 'Orihuela Costa',
    municipalityES: 'Orihuela Costa',
    province: 'Alicante',
    region: 'Costa Blanca Sør',
    askingPricePerSqm: 2000,
    transactionPricePerSqm: 1750,
    yoyChangePct: 11,
    trend: 'stigende',
    avgDaysOnMarket: 270,
    notes: 'Stort utvalg av urb.-eiendommer. Villamartin, Campoamor, Las Ramblas. Varierer mye per urbanisering.'
  },
  {
    municipality: 'Pilar de la Horadada',
    municipalityES: 'Pilar de la Horadada',
    province: 'Alicante',
    region: 'Costa Blanca Sør',
    askingPricePerSqm: 1800,
    transactionPricePerSqm: 1550,
    yoyChangePct: 10,
    trend: 'stigende',
    avgDaysOnMarket: 290,
    notes: 'Sørligste del av Alicante-provinsen, grenser mot Murcia.'
  },
  {
    municipality: 'San Miguel de Salinas',
    municipalityES: 'San Miguel de Salinas',
    province: 'Alicante',
    region: 'Costa Blanca Sør',
    askingPricePerSqm: 1400,
    transactionPricePerSqm: 1200,
    yoyChangePct: 8,
    trend: 'stigende',
    avgDaysOnMarket: 310,
  },

  // ═══ INNLAND ALICANTE ════════════════════════════════════════════════════════

  {
    municipality: 'Pinoso',
    municipalityES: 'Pinoso / El Pinós',
    province: 'Alicante',
    region: 'Innland Alicante',
    askingPricePerSqm: 749,
    transactionPricePerSqm: 620,
    yoyChangePct: 6,
    trend: 'stigende',
    avgDaysOnMarket: 360,
    notes: 'Vinland, fincas, lav pris. Attraktivt for selvforsynt livsstil. Vår merkevare Pinoso er spesialisert her.'
  },
  {
    municipality: 'Biar',
    municipalityES: 'Biar',
    province: 'Alicante',
    region: 'Innland Alicante',
    askingPricePerSqm: 700,
    transactionPricePerSqm: 580,
    yoyChangePct: 5,
    trend: 'stigende',
    avgDaysOnMarket: 380,
    notes: 'Middelalderborg. Vår merkevare ZenEco er spesialisert i denne regionen.'
  },
  {
    municipality: 'Villena',
    municipalityES: 'Villena',
    province: 'Alicante',
    region: 'Innland Alicante',
    askingPricePerSqm: 1000,
    transactionPricePerSqm: 840,
    yoyChangePct: 6,
    trend: 'stigende',
    avgDaysOnMarket: 340,
  },
  {
    municipality: 'Monóvar',
    municipalityES: 'Monòver / Monóvar',
    province: 'Alicante',
    region: 'Innland Alicante',
    askingPricePerSqm: 900,
    transactionPricePerSqm: 750,
    yoyChangePct: 5,
    trend: 'stabilt',
    avgDaysOnMarket: 350,
  },
  {
    municipality: 'Novelda',
    municipalityES: 'Novelda',
    province: 'Alicante',
    region: 'Innland Alicante',
    askingPricePerSqm: 1100,
    transactionPricePerSqm: 920,
    yoyChangePct: 6,
    trend: 'stigende',
    avgDaysOnMarket: 330,
  },
  {
    municipality: 'Aspe',
    municipalityES: 'Aspe',
    province: 'Alicante',
    region: 'Innland Alicante',
    askingPricePerSqm: 1050,
    transactionPricePerSqm: 870,
    yoyChangePct: 5,
    trend: 'stabilt',
    avgDaysOnMarket: 350,
  },
  {
    municipality: 'Petrer',
    municipalityES: 'Petrer',
    province: 'Alicante',
    region: 'Innland Alicante',
    askingPricePerSqm: 1200,
    transactionPricePerSqm: 1000,
    yoyChangePct: 7,
    trend: 'stigende',
    avgDaysOnMarket: 320,
  },
  {
    municipality: 'Elda',
    municipalityES: 'Elda',
    province: 'Alicante',
    region: 'Innland Alicante',
    askingPricePerSqm: 1000,
    transactionPricePerSqm: 830,
    yoyChangePct: 5,
    trend: 'stabilt',
    avgDaysOnMarket: 350,
  },

  // ═══ COSTA CÁLIDA – MURCIA ════════════════════════════════════════════════════

  {
    municipality: 'San Pedro del Pinatar',
    municipalityES: 'San Pedro del Pinatar',
    province: 'Murcia',
    region: 'Costa Cálida Murcia',
    askingPricePerSqm: 2027,
    transactionPricePerSqm: 1780,
    yoyChangePct: 45.9, // Idealista historisk rekord Q4 2025
    trend: 'sterkt stigende',
    avgDaysOnMarket: 200,
    notes: 'Historisk rekord Q4 2025. Mar Menor-tilgang, saltvann-spa-tradisjon.'
  },
  {
    municipality: 'Los Alcázares',
    municipalityES: 'Los Alcázares',
    province: 'Murcia',
    region: 'Costa Cálida Murcia',
    askingPricePerSqm: 2000,
    transactionPricePerSqm: 1750,
    yoyChangePct: 30,
    trend: 'sterkt stigende',
    avgDaysOnMarket: 210,
    notes: 'Strandby ved Mar Menor. Sterk vekst 2024–2025.'
  },
  {
    municipality: 'La Manga del Mar Menor',
    municipalityES: 'La Manga del Mar Menor',
    province: 'Murcia',
    region: 'Costa Cálida Murcia',
    askingPricePerSqm: 1944,
    transactionPricePerSqm: 1700,
    yoyChangePct: 15,
    trend: 'stigende',
    avgDaysOnMarket: 240,
    notes: 'Halvøy mellom Middelhavet og Mar Menor. Høyeste leiepris i Murcia: 10 €/m².'
  },
  {
    municipality: 'San Javier',
    municipalityES: 'San Javier',
    province: 'Murcia',
    region: 'Costa Cálida Murcia',
    askingPricePerSqm: 1850,
    transactionPricePerSqm: 1600,
    yoyChangePct: 18,
    trend: 'sterkt stigende',
    avgDaysOnMarket: 230,
  },
  {
    municipality: 'Santiago de la Ribera',
    municipalityES: 'Santiago de la Ribera',
    province: 'Murcia',
    region: 'Costa Cálida Murcia',
    askingPricePerSqm: 1750,
    transactionPricePerSqm: 1520,
    yoyChangePct: 14,
    trend: 'stigende',
    avgDaysOnMarket: 250,
  },
  {
    municipality: 'Mazarrón',
    municipalityES: 'Mazarrón',
    province: 'Murcia',
    region: 'Costa Cálida Murcia',
    askingPricePerSqm: 1531,
    transactionPricePerSqm: 1320,
    yoyChangePct: 12,
    trend: 'stigende',
    avgDaysOnMarket: 270,
    notes: 'Puerto de Mazarrón: 1.369 €/m² (prisantydning).'
  },
  {
    municipality: 'Águilas',
    municipalityES: 'Águilas',
    province: 'Murcia',
    region: 'Costa Cálida Murcia',
    askingPricePerSqm: 1404,
    transactionPricePerSqm: 1200,
    yoyChangePct: 10,
    trend: 'stigende',
    avgDaysOnMarket: 290,
    notes: 'Casco Antiguo Águilas: 939 €/m².'
  },
  {
    municipality: 'Cartagena',
    municipalityES: 'Cartagena',
    province: 'Murcia',
    region: 'Costa Cálida Murcia',
    askingPricePerSqm: 1338,
    transactionPricePerSqm: 1150,
    yoyChangePct: 9,
    trend: 'stigende',
    avgDaysOnMarket: 300,
  },
  {
    municipality: 'Lorca',
    municipalityES: 'Lorca',
    province: 'Murcia',
    region: 'Costa Cálida Murcia',
    askingPricePerSqm: 1200,
    transactionPricePerSqm: 1020,
    yoyChangePct: 7,
    trend: 'stabilt',
    avgDaysOnMarket: 330,
  },
  {
    municipality: 'Murcia by',
    municipalityES: 'Murcia',
    province: 'Murcia',
    region: 'Costa Cálida Murcia',
    askingPricePerSqm: 1520,
    transactionPricePerSqm: 1300,
    yoyChangePct: 13,
    trend: 'stigende',
    avgDaysOnMarket: 290,
  },
];

// ─── Hjelpefunksjoner ─────────────────────────────────────────────────────────

/** Finn markedsdata for et bestemt kommunenavn (fuzzy match) */
export function getAreaData(municipality: string): AreaMarketData | null {
  const q = municipality.toLowerCase().trim();
  return (
    AREA_MARKET_DATA.find(a =>
      a.municipality.toLowerCase().includes(q) ||
      a.municipalityES.toLowerCase().includes(q) ||
      q.includes(a.municipality.toLowerCase())
    ) ?? null
  );
}

/** Generer den komplette markedsdata-teksten som injiseres i AI-prompten */
export function buildMarketDataPrompt(): string {
  const byRegion: Record<MarketRegion, AreaMarketData[]> = {
    'Costa Blanca Nord': [],
    'Costa Blanca Sør': [],
    'Innland Alicante': [],
    'Costa Cálida Murcia': [],
    'Annet': [],
  };
  for (const a of AREA_MARKET_DATA) byRegion[a.region].push(a);

  const col = (n: number, w: number) => String(n).padStart(w);
  const pct = (n?: number) => n != null ? `+${n.toFixed(1)}%` : '—';

  let out = `
═══════════════════════════════════════════
REFERANSEDATA – PRISANTYDNING vs TRANSAKSJONSPRIS
Kilde: ${MARKET_DATA_SOURCE}
Sist oppdatert: ${MARKET_DATA_UPDATED}
═══════════════════════════════════════════

⚠️  VIKTIG DISTINKSJON:
– Idealista-priser = PRISANTYDNING (annonsepris)
– Transaksjonspris = faktisk betalt (notardata / CasaSafari)
– Closing-to-asking ratio Costa Blanca: ~${(CLOSING_TO_ASKING_RATIO * 100).toFixed(1)}%
   → Selger får i snitt ${((1 - CLOSING_TO_ASKING_RATIO) * 100).toFixed(1)}% under prisantydning
– Bruk ALLTID transaksjonspris som grunnlag for verdivurdering
– Anbefalt listepris = transaksjonspris + 4–6% forhandlingsmargin

TID PÅ MARKEDET – Calpe Pueblo (representativt Costa Blanca Nord):
€100k–200k: ~11–13 mnd  |  €200k–300k: ~11–12 mnd  |  €300k–400k: ~13 mnd
€400k–500k: ~16 mnd     |  €500k–700k: ~17 mnd     |  Snitt alle: ~276 dager

PRISJUSTERINGSFAKTORER (% over/under basisverdi for området):
Havutsikt direkte:   +20 – +35%  |  Sjøutsikt delvis: +10 – +20%
Sørvendt:            +8 – +12%   |  Privatbasseng vs fellesareal: +5 – +15%
Energikarakter A/B:  +5 – +15%   |  Nybygg vs eldre (1970–90): +10 – +20%
Garasje/parkering:   +3 – +8%    |  Solcellepaneler:  +3 – +5%
Veldig dårlig stand: -15 – -30%  |  Trenger total renovering: -20 – -35%

`;

  for (const [region, areas] of Object.entries(byRegion)) {
    if (areas.length === 0) continue;
    out += `\n${region.toUpperCase()}:\n`;
    out += `${'Kommune'.padEnd(28)} ${'Prisantydning'.padStart(14)} ${'Transaksjon'.padStart(12)} ${'YoY'.padStart(7)} ${'Trend'.padEnd(20)}\n`;
    out += '─'.repeat(83) + '\n';
    for (const a of areas) {
      const name = a.municipality.padEnd(28);
      const ask = `${col(a.askingPricePerSqm, 5)} €/m²`.padStart(14);
      const txn = `${col(a.transactionPricePerSqm, 5)} €/m²`.padStart(12);
      const yoy = pct(a.yoyChangePct).padStart(7);
      const trend = a.trend.padEnd(20);
      out += `${name} ${ask} ${txn} ${yoy}  ${trend}\n`;
      if (a.notes) out += `  → ${a.notes}\n`;
    }
  }

  out += `
REGIONALT REFERANSE (Idealista, jan. 2026):
Spania (nasjonalt):        2.650 €/m²  (+18,4%)
Comunitat Valenciana:      2.271 €/m²  (+18,0%)
Alicante-provinsen:        2.499 €/m²  (+11,2%)
Murcia-regionen:           1.520 €/m²  (+12,7%)
Balearene:                 5.068 €/m²
Madrid:                    4.384 €/m²
Málaga:                    3.842 €/m²

LEIEAVKASTNING (brutto):
Alicante snitt:    5,59%  (range 3,69–6,95%)
Benidorm ferie:    6–8%
Torrevieja ferie:  5–7%
La Manga:          7–9%   (høy sesongetterspørsel)
`;

  return out;
}

/** Returner en rask oppsummering for ett bestemt område (til inndata-hint i skjemaet) */
export function getAreaHint(municipality: string): string | null {
  const a = getAreaData(municipality);
  if (!a) return null;
  return `${a.region} · Prisantydning ~${a.askingPricePerSqm.toLocaleString()} €/m² · Transaksjon ~${a.transactionPricePerSqm.toLocaleString()} €/m² · YoY ${a.yoyChangePct != null ? `+${a.yoyChangePct}%` : '—'} · Snitt ${a.avgDaysOnMarket ?? '?'} dager på markedet`;
}
