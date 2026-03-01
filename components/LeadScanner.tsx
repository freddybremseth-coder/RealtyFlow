import React, { useState } from 'react';
import { Camera, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { gemini } from '../services/claudeService';
import { leadStore } from '../services/leadService';
import { LeadStatus } from '../types';

export const LeadScanner = () => {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setStatus('uploading');
    setMessage('Analyserer skjema med AI...');

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const base64 = (ev.target?.result as string).split(',')[1];
          const extracted = await gemini.extractLeadsFromImage(base64, file.type);

          if (!extracted || extracted.length === 0) {
            setStatus('error');
            setMessage('Ingen kontaktinfo funnet i bildet.');
            return;
          }

          for (const l of extracted) {
            await leadStore.addLead({
              id: `scan-${Math.random().toString(36).substr(2, 9)}`,
              status: LeadStatus.NEW,
              sentiment: 70,
              urgency: 60,
              intent: 80,
              lastActivity: 'AI Skjema-skann',
              source: 'Lead Scanner',
              value: l.value || 0,
              name: l.name || 'Ukjent',
              email: l.email || '',
              phone: l.phone || '',
              summary: l.summary || '',
              personalityType: l.personalityType || '',
              requirements: { budget: l.value || 0, location: l.location || '' },
            });
          }

          setStatus('success');
          setMessage(`${extracted.length} lead${extracted.length > 1 ? 's' : ''} lagret!`);
          setTimeout(() => setStatus('idle'), 3000);
        } catch (err: any) {
          setStatus('error');
          setMessage(err.message || 'AI-analyse feilet.');
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Kunne ikke lese bildet.');
    }

    // Reset input so same file can be re-selected
    e.target.value = '';
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
        {status === 'error' && <><AlertTriangle className="w-5 h-5" /> {message}</>}
      </button>
    </div>
  );
};
