import React, { useState } from 'react';
import { Camera, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export const LeadScanner = () => {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setStatus('uploading');
    setMessage('Analyserer skjema med AI...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', 'RealtyFlow App');

    try {
      // Bruker environment variable for webhook URL, eller fallback
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_OCR || 'https://DIN-N8N-URL/webhook/ocr-lead';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Lead lagret i Airtable!');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error('Opplasting feilet');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage('Kunne ikke sende bilde. Sjekk nettverk/webhook.');
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        disabled={status === 'uploading'}
      />
      
      <button 
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold transition-all border
          ${status === 'idle' ? 'bg-[#00D9FF]/10 border-[#00D9FF] text-[#00D9FF] hover:bg-[#00D9FF]/20' : ''}
          ${status === 'uploading' ? 'bg-[#FFBE0B]/10 border-[#FFBE0B] text-[#FFBE0B]' : ''}
          ${status === 'success' ? 'bg-green-500/10 border-green-500 text-green-500' : ''}
          ${status === 'error' ? 'bg-[#FF006E]/10 border-[#FF006E] text-[#FF006E]' : ''}
        `}
      >
        {status === 'idle' && <><Camera className="w-5 h-5" /> SCAN LEAD FORM</>}
        {status === 'uploading' && <><Loader2 className="w-5 h-5 animate-spin" /> {message}</>}
        {status === 'success' && <><CheckCircle className="w-5 h-5" /> {message}</>}
        {status === 'error' && <><AlertTriangle className="w-5 h-5" /> GLITCH!</>}
      </button>
    </div>
  );
};
