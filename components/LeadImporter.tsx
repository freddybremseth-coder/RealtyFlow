import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';                          // ← riktig import (var feil før)
import {
  X, Upload, FileText, Loader2, CheckCircle2,
  AlertTriangle, ArrowRight, Sparkles, Trash2,
  ChevronDown, RefreshCw, Building2,
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { leadStore } from '../services/leadService';
import { settingsStore } from '../services/settingsService';

// ─── Typer ────────────────────────────────────────────────────────────────────

type LeadField =
  | 'name' | 'email' | 'phone' | 'location'
  | 'budget' | 'source' | 'notes' | 'nationality' | '_skip';

const LEAD_FIELDS: { value: LeadField | ''; label: string }[] = [
  { value: '',           label: '— Ikke importer —' },
  { value: 'name',       label: 'Navn'              },
  { value: 'email',      label: 'E-post'            },
  { value: 'phone',      label: 'Telefon'           },
  { value: 'location',   label: 'Sted / By'         },
  { value: 'budget',     label: 'Budsjett'          },
  { value: 'source',     label: 'Kilde'             },
  { value: 'nationality',label: 'Nasjonalitet'      },
  { value: 'notes',      label: 'Notater / Melding' },
  { value: '_skip',      label: '× Hopp over'       },
];

interface FileJob {
  id: string;
  file: File;
  headers: string[];
  rows: Record<string, string>[];
  mapping: Record<string, LeadField | ''>;
  aiConfidence: Record<string, number>;   // 0–1 per kolonne
  status: 'queued' | 'ai-mapping' | 'ready' | 'importing' | 'done' | 'error';
  result?: { success: number; errors: number };
  errorMsg?: string;
}

// ─── AI-feltmapping via Anthropic ─────────────────────────────────────────────

async function aiMapHeaders(
  headers: string[],
  sampleRows: Record<string, string>[],
  apiKey: string,
): Promise<Record<string, { field: LeadField | ''; confidence: number }>> {
  const sample = sampleRows.slice(0, 3).map(r =>
    headers.map(h => r[h] ?? '').join(' | '),
  ).join('\n');

  const prompt = `Du er en datamappings-ekspert. Brukeren har lastet opp en CSV med følgende kolonner og eksempeldata.
Kolonner: ${JSON.stringify(headers)}
Eksempelrader:
${sample}

Mapp HVER kolonne til ett av disse lead-feltene:
name (navn, kundenavn, fornavn+etternavn, full name, kunde, kontakt, person)
email (e-post, epost, mail, email)
phone (telefon, tlf, mobil, phone, cel)
location (sted, by, adresse, city, location, område, region, land)
budget (budsjett, budget, pris, price, verdi, økonomi)
source (kilde, how found, kanal, campaign)
nationality (nasjonalitet, nationality, land, country)
notes (melding, message, kommentar, comment, tekst, info)
_skip (irrelevant, id, dato, internt felt som ikke er nyttig for CRM)

Svar KUN med gyldig JSON slik:
{"KolonneNavn": {"field": "name", "confidence": 0.95}, ...}
confidence er en float 0.0–1.0 som angir hvor sikker du er.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? '{}';
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] ?? '{}';
    return JSON.parse(jsonStr);
  } catch {
    return {};
  }
}

// ─── Rad → Lead ───────────────────────────────────────────────────────────────

function rowToLead(
  row: Record<string, string>,
  mapping: Record<string, LeadField | ''>,
  brandId: string,
): Lead | null {
  const lead: Partial<Lead> = {
    id:           `csv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status:       LeadStatus.NEW,
    brandId,
    source:       'CSV Import',
    sentiment:    50,
    urgency:      50,
    intent:       50,
    value:        0,
    emails:       [],
    lastActivity: new Date().toLocaleDateString('no-NO'),
    summary:      '',
  };

  const summaryParts: string[] = [];
  const requirements: Record<string, unknown> = {};

  for (const [header, field] of Object.entries(mapping)) {
    if (!field || field === '_skip') continue;
    const val = row[header]?.trim() ?? '';
    if (!val) continue;

    switch (field) {
      case 'name':        lead.name   = val; break;
      case 'email':       lead.email  = val; break;
      case 'phone':       lead.phone  = val; break;
      case 'source':      lead.source = val; break;
      case 'location':    requirements.location    = val; summaryParts.push(val); break;
      case 'nationality': requirements.nationality = val; break;
      case 'notes':       summaryParts.push(`"${val.slice(0, 150)}"`); break;
      case 'budget': {
        const num = parseFloat(val.replace(/[^0-9.,]/g, '').replace(',', '.'));
        if (!isNaN(num)) { lead.value = num; requirements.budget = num; }
        summaryParts.push(`Budsjett: ${val}`);
        break;
      }
    }
  }

  lead.requirements = requirements as Lead['requirements'];

  if (!lead.name && !lead.email) return null; // trenger minst ett identifiserende felt
  if (!lead.name) lead.name = lead.email ?? 'Ukjent';
  lead.summary = summaryParts.join(' • ') || 'Importert via CSV';

  return lead as Lead;
}

// ─── Komponent ────────────────────────────────────────────────────────────────

const LeadImporter: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const brands = settingsStore.getBrands();

  const [step, setStep]           = useState<1 | 2 | 3 | 4>(1);
  const [brandId, setBrandId]     = useState(brands[0]?.id ?? '');
  const [jobs, setJobs]           = useState<FileJob[]>([]);
  const [activeJobIdx, setActiveJobIdx] = useState(0);
  const [totalResult, setTotalResult]   = useState({ success: 0, errors: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateJob = (id: string, patch: Partial<FileJob>) =>
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j));

  // ── Step 1: parse filer ───────────────────────────────────────────────────

  const parseFiles = useCallback((files: File[]) => {
    const csvFiles = files.filter(f =>
      f.name.endsWith('.csv') || f.type === 'text/csv' || f.type === 'application/vnd.ms-excel',
    );
    if (!csvFiles.length) return;

    csvFiles.forEach(file => {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setJobs(prev => [...prev, {
            id,
            file,
            headers:      result.meta.fields ?? [],
            rows:         result.data,
            mapping:      {},
            aiConfidence: {},
            status:       'queued',
          }]);
        },
      });
    });
  }, []);

  const onDrop = useCallback((accepted: File[]) => parseFiles(accepted), [parseFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    multiple: true,
    noClick: true,             // vi styrer klikk manuelt
  });

  const removeJob = (id: string) => setJobs(prev => prev.filter(j => j.id !== id));

  // ── Step 2: AI-mapping av alle filer ──────────────────────────────────────

  const runAiMapping = async () => {
    const apiKey = settingsStore.getApiKeys().anthropic;
    setStep(2);

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      setActiveJobIdx(i);
      updateJob(job.id, { status: 'ai-mapping' });

      const result = await aiMapHeaders(job.headers, job.rows, apiKey);

      const mapping: Record<string, LeadField | ''> = {};
      const aiConfidence: Record<string, number> = {};

      for (const h of job.headers) {
        const r = result[h];
        mapping[h]      = r?.field ?? '';
        aiConfidence[h] = r?.confidence ?? 0;
      }

      updateJob(job.id, { mapping, aiConfidence, status: 'ready' });
    }

    setActiveJobIdx(0);
  };

  // ── Step 3: Import ────────────────────────────────────────────────────────

  const runImport = async () => {
    setStep(3);
    let totalSuccess = 0;
    let totalErrors  = 0;

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      setActiveJobIdx(i);
      updateJob(job.id, { status: 'importing' });

      let success = 0;
      let errors  = 0;

      for (const row of job.rows) {
        const lead = rowToLead(row, job.mapping, brandId);
        if (lead) {
          await leadStore.addLead(lead);
          success++;
        } else {
          errors++;
        }
      }

      totalSuccess += success;
      totalErrors  += errors;
      updateJob(job.id, { status: 'done', result: { success, errors } });
    }

    setTotalResult({ success: totalSuccess, errors: totalErrors });
    setStep(4);
  };

  const reset = () => {
    setStep(1);
    setJobs([]);
    setActiveJobIdx(0);
    setTotalResult({ success: 0, errors: 0 });
  };

  if (!isOpen) return null;

  const activeJob = jobs[activeJobIdx];
  const allReady  = jobs.length > 0 && jobs.every(j => j.status === 'ready');

  const iCls  = "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-all";
  const sCls  = "bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-400 focus:outline-none focus:border-cyan-500 transition-all";

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <header className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="text-cyan-400" size={20} /> Importer Leads
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              {[1,2,3,4].map(s => (
                <div key={s} className={`h-1 rounded-full transition-all ${s <= step ? 'w-8 bg-cyan-500' : 'w-4 bg-slate-800'}`} />
              ))}
              <span className="text-[10px] text-slate-600 ml-1">Steg {step} av 4</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </header>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">

          {/* ── STEG 1: Last opp ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">

              {/* Merkevare-velger */}
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 tracking-widest mb-1.5">
                  Hvilken merkevare gjelder denne importen?
                </label>
                <div className="relative">
                  <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    className={sCls + ' pl-8 w-full'}
                    value={brandId}
                    onChange={e => setBrandId(e.target.value)}
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name} — {b.type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${
                  isDragActive ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input {...getInputProps()} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  multiple
                  className="hidden"
                  onChange={e => parseFiles(Array.from(e.target.files ?? []))}
                />
                <Upload size={36} className="mx-auto text-slate-600 mb-3" />
                <p className="font-bold text-slate-300 mb-1">Dra og slipp CSV-filer her, eller klikk for å velge</p>
                <p className="text-xs text-slate-600">Flere filer støttes · AI kartlegger feltene automatisk</p>
              </div>

              {/* Filer i kø */}
              {jobs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">
                    {jobs.length} fil{jobs.length !== 1 ? 'er' : ''} i kø
                  </p>
                  {jobs.map(job => (
                    <div key={job.id} className="flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <FileText size={14} className="text-cyan-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{job.file.name}</p>
                        <p className="text-[10px] text-slate-600">{job.rows.length} rader · {job.headers.length} kolonner</p>
                      </div>
                      <button onClick={() => removeJob(job.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Neste */}
              <button
                onClick={runAiMapping}
                disabled={jobs.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles size={15} />
                La AI kartlegge felt automatisk
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* ── STEG 2: AI-mapping / Review ──────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">

              {/* Fil-tabs */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {jobs.map((job, i) => (
                  <button
                    key={job.id}
                    onClick={() => setActiveJobIdx(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      i === activeJobIdx
                        ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {job.status === 'ai-mapping' && <Loader2 size={10} className="animate-spin" />}
                    {job.status === 'ready'      && <CheckCircle2 size={10} className="text-emerald-400" />}
                    {job.status === 'queued'     && <div className="w-2 h-2 rounded-full bg-slate-600" />}
                    {job.file.name.slice(0, 20)}
                  </button>
                ))}
              </div>

              {activeJob && (
                <>
                  {/* AI-status */}
                  {activeJob.status === 'ai-mapping' ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <Loader2 size={32} className="animate-spin text-cyan-400" />
                      <p className="text-sm text-slate-400">AI analyserer kolonner i <span className="text-cyan-400">{activeJob.file.name}</span>…</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          <span className="text-slate-300 font-bold">{activeJob.rows.length} rader</span> · Juster mapping om nødvendig
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-indigo-400">
                          <Sparkles size={10} /> AI-foreslått
                        </div>
                      </div>

                      {/* Mapping-tabell */}
                      <div className="border border-slate-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-900">
                            <tr>
                              <th className="text-left px-4 py-3 text-[10px] uppercase font-mono text-slate-500 tracking-widest">CSV-kolonne</th>
                              <th className="text-left px-4 py-3 text-[10px] uppercase font-mono text-slate-500 tracking-widest">Eksempel</th>
                              <th className="text-left px-4 py-3 text-[10px] uppercase font-mono text-slate-500 tracking-widest">Lead-felt</th>
                              <th className="text-left px-4 py-3 text-[10px] uppercase font-mono text-slate-500 tracking-widest">AI %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeJob.headers.map(h => {
                              const conf = activeJob.aiConfidence[h] ?? 0;
                              const confColor =
                                conf >= 0.8 ? 'text-emerald-400' :
                                conf >= 0.5 ? 'text-amber-400' : 'text-slate-600';
                              return (
                                <tr key={h} className="border-t border-slate-800 hover:bg-slate-900/50 transition-colors">
                                  <td className="px-4 py-2.5 font-mono text-slate-300">{h}</td>
                                  <td className="px-4 py-2.5 text-slate-500 truncate max-w-[120px]">
                                    {activeJob.rows[0]?.[h] ?? '—'}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <select
                                      className={sCls}
                                      value={activeJob.mapping[h] ?? ''}
                                      onChange={e =>
                                        updateJob(activeJob.id, {
                                          mapping: { ...activeJob.mapping, [h]: e.target.value as LeadField | '' },
                                        })
                                      }
                                    >
                                      {LEAD_FIELDS.map(f => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className={`px-4 py-2.5 font-mono font-bold ${confColor}`}>
                                    {conf ? `${Math.round(conf * 100)}%` : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Preview av rader */}
                      <div>
                        <p className="text-[10px] uppercase font-mono text-slate-600 mb-2">Forhåndsvisning (3 rader)</p>
                        <div className="overflow-x-auto border border-slate-800 rounded-xl">
                          <table className="text-[10px] text-slate-500 w-max min-w-full">
                            <thead className="bg-slate-900">
                              <tr>
                                {activeJob.headers
                                  .filter(h => activeJob.mapping[h] && activeJob.mapping[h] !== '_skip')
                                  .map(h => (
                                    <th key={h} className="px-3 py-2 text-left font-mono whitespace-nowrap">
                                      <span className="text-cyan-400">{activeJob.mapping[h]}</span>
                                      <span className="text-slate-700 ml-1">← {h}</span>
                                    </th>
                                  ))
                                }
                              </tr>
                            </thead>
                            <tbody>
                              {activeJob.rows.slice(0, 3).map((row, i) => (
                                <tr key={i} className="border-t border-slate-800">
                                  {activeJob.headers
                                    .filter(h => activeJob.mapping[h] && activeJob.mapping[h] !== '_skip')
                                    .map(h => (
                                      <td key={h} className="px-3 py-2 truncate max-w-[160px]">{row[h]}</td>
                                    ))
                                  }
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Handlinger */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button onClick={reset} className="text-xs text-slate-600 hover:text-slate-400">
                  <RefreshCw size={11} className="inline mr-1" /> Start på nytt
                </button>
                <button
                  onClick={runImport}
                  disabled={!allReady}
                  className="flex items-center gap-2 px-8 py-3 bg-cyan-500 text-slate-950 rounded-xl font-bold text-sm hover:bg-cyan-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                >
                  Importer {jobs.reduce((acc, j) => acc + j.rows.length, 0)} leads
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEG 3: Importerer ───────────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
              <Loader2 size={48} className="animate-spin text-cyan-400" />
              <div>
                <p className="text-lg font-bold text-white mb-1">Importerer leads…</p>
                <p className="text-sm text-slate-400">
                  Fil {activeJobIdx + 1} av {jobs.length}: <span className="text-cyan-400">{activeJob?.file.name}</span>
                </p>
              </div>
              <div className="w-full max-w-sm bg-slate-900 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((activeJobIdx) / jobs.length) * 100}%` }}
                />
              </div>
              <div className="space-y-2 w-full max-w-sm">
                {jobs.map((job, i) => (
                  <div key={job.id} className="flex items-center gap-3 text-xs text-left">
                    {job.status === 'done'      && <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />}
                    {job.status === 'importing' && <Loader2 size={13} className="animate-spin text-cyan-400 shrink-0" />}
                    {(job.status === 'ready' || job.status === 'queued') && <div className="w-3 h-3 rounded-full border border-slate-700 shrink-0" />}
                    <span className={job.status === 'importing' ? 'text-cyan-400' : job.status === 'done' ? 'text-emerald-400' : 'text-slate-600'}>
                      {job.file.name}
                    </span>
                    {job.result && (
                      <span className="ml-auto text-slate-600">{job.result.success} OK</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEG 4: Ferdig ───────────────────────────────────────── */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Import fullført!</h3>
                <p className="text-slate-400 text-sm">
                  <span className="text-emerald-400 font-bold">{totalResult.success}</span> leads lagt til ·{' '}
                  <span className={totalResult.errors > 0 ? 'text-amber-400' : 'text-slate-600'}>
                    {totalResult.errors} hoppet over
                  </span>
                </p>
              </div>

              {/* Per-fil resultat */}
              <div className="w-full max-w-sm space-y-2">
                {jobs.map(job => (
                  <div key={job.id} className="flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                    <FileText size={13} className="text-slate-600 shrink-0" />
                    <span className="flex-1 truncate text-slate-400">{job.file.name}</span>
                    <span className="text-emerald-400 font-bold">{job.result?.success ?? 0} OK</span>
                    {(job.result?.errors ?? 0) > 0 && (
                      <span className="text-amber-500">{job.result!.errors} feil</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all"
                >
                  Last inn flere filer
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all"
                >
                  Lukk
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadImporter;
