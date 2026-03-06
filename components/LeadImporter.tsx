
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Papa } from 'papaparse';
import { X, Upload, FileText, Loader2, CheckCircle, AlertTriangle, ArrowRight, Camera } from 'lucide-react';
import { Customer, CustomerStatus, CustomerType } from '../types';
import { crmStore } from '../services/crmService';
import { LeadScanner } from './LeadScanner'; // Assuming LeadScanner is in the same folder

const LeadImporter: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, keyof Customer | ''>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);

  const crmFields: (keyof Customer)[] = ['name', 'email', 'phone', 'nationality', 'source', 'location', 'budget', 'tags', 'notes'];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      parseFile(uploadedFile);
    }
  }, []);

  const parseFile = (file: File) => {
    if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setHeaders(results.meta.fields || []);
          setRows(results.data);
          setStep(2);
        },
      });
    } else {
      alert('Kun CSV-filer er støttet foreløpig.');
    }
  };

  const handleMappingChange = (header: string, field: keyof Customer | '') => {
    setMapping(prev => ({ ...prev, [header]: field }));
  };

  const handleImport = () => {
    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    rows.forEach(row => {
      try {
        const customer: Partial<Customer> = {
            id: `imp-${Date.now()}-${Math.random()}`,
            status: CustomerStatus.ACTIVE,
            type: CustomerType.BUYER,
            createdAt: new Date().toISOString(),
            lastContact: new Date().toISOString(),
        };

        Object.keys(mapping).forEach(header => {
          const crmField = mapping[header];
          if (crmField && row[header]) {
            if (crmField === 'budget') {
                customer.budget = parseInt(row[header], 10) || 0;
            } else if(crmField === 'tags') {
                customer.tags = row[header].split(',');
            } else {
                (customer as any)[crmField] = row[header];
            }
          }
        });
        
        if (customer.name && customer.email) {
            crmStore.addCustomer(customer as Customer);
            successCount++;
        } else {
            errorCount++;
        }
      } catch (e) {
        errorCount++;
      }
    });

    setImportResult({ success: successCount, errors: errorCount });
    setIsImporting(false);
    setStep(3);
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setImportResult(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] }, multiple: false });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
        <header className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="text-cyan-400" size={20} /> Importer Leads
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </header>

        <div className="p-8 flex-1 min-h-[60vh]">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-8">
              <div {...getRootProps()} className={`w-full max-w-lg p-12 border-2 border-dashed rounded-3xl cursor-pointer transition-colors ${isDragActive ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4 text-slate-500">
                    <Upload size={40} />
                    <p className="font-bold text-slate-300">Dra og slipp CSV-fil her, eller klikk for å velge</p>
                    <p className="text-xs">XML-støtte kommer snart.</p>
                </div>
              </div>
              <div className="text-slate-600">eller</div>
              <LeadScanner />
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 2 && (
            <div className="flex flex-col h-full">
              <h4 className="text-sm font-bold text-slate-300 mb-1">Forhåndsvisning og Felt-mapping</h4>
              <p className="text-xs text-slate-500 mb-4">Koble kolonner fra filen til felter i CRM-systemet.</p>
              <div className="flex-1 overflow-auto custom-scrollbar border border-slate-800 rounded-2xl bg-slate-950/50 p-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left">
                      {headers.map(h => (
                        <th key={h} className="p-3 font-mono text-slate-500">
                          {h}
                           <select 
                              className="block w-full mt-2 bg-slate-800 border border-slate-700 rounded-md p-1.5 text-[10px] text-cyan-400 focus:outline-none focus:border-cyan-600"
                              value={mapping[h] || ''}
                              onChange={e => handleMappingChange(h, e.target.value as keyof Customer)}
                            >
                                <option value="">Ikke importer</option>
                                {crmFields.map(f => <option key={f} value={f}>{f}</option>)}
                           </select>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t border-slate-800">
                        {headers.map(h => <td key={`${i}-${h}`} className="p-3 text-slate-400 truncate max-w-[150px]">{row[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-6">
                <button onClick={reset} className="text-xs text-slate-500 hover:text-white">Avbryt</button>
                <button onClick={handleImport} disabled={Object.keys(mapping).length === 0} className="px-8 py-3 bg-cyan-500 text-slate-950 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all disabled:opacity-50">
                  Importer {rows.length} Leads <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 3 && (
             <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                {isImporting ? (
                    <><Loader2 className="animate-spin text-cyan-400" size={48} /><p className="text-slate-400">Importerer...</p></>
                ) : importResult ? (
                    <>
                        <CheckCircle size={48} className="text-emerald-400" />
                        <h3 className="text-xl font-bold text-white">Import Fullført!</h3>
                        <p className="text-slate-400">{importResult.success} nye leads ble lagt til.</p>
                        {importResult.errors > 0 && <p className="text-amber-500 text-sm">{importResult.errors} rader ble hoppet over pga. manglende data.</p>}
                        <button onClick={onClose} className="mt-4 px-6 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg text-sm font-semibold">Lukk</button>
                    </>
                ) : (
                    <>
                        <AlertTriangle size={48} className="text-red-400" />
                        <h3 className="text-xl font-bold text-white">Import Feilet</h3>
                        <button onClick={reset} className="mt-4 px-6 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-semibold">Prøv igjen</button>
                    </>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadImporter;
