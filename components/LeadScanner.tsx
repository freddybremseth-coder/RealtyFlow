
import React, { useState } from 'react';
import { Camera, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { gemini } from '../services/geminiService';
import { crmStore } from '../services/crmService';
import { CustomerStatus, CustomerType } from '../types';
import './LeadScanner.css';

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
          if (!ev.target?.result) {
            throw new Error("Kunne ikke lese filen.");
          }
          const base64 = (ev.target.result as string).split(',')[1];
          const extracted = await gemini.extractLeadsFromImage(base64, file.type);

          if (!extracted || extracted.length === 0) {
            setStatus('error');
            setMessage('Ingen kontaktinfo funnet i bildet.');
            return;
          }

          for (const l of extracted) {
            crmStore.addCustomer({
              id: `scan-${Math.random().toString(36).substr(2, 9)}`,
              name: l.name || 'Ukjent',
              email: l.email || '',
              phone: l.phone || '',
              status: CustomerStatus.ACTIVE,
              type: CustomerType.BUYER,
              source: 'Lead Scanner',
              notes: l.summary || '',
              budget: l.value || 0,
              location: l.location || '',
              createdAt: new Date().toISOString(),
              lastContact: new Date().toISOString(),
              propertiesInterested: [],
              propertiesBought: [],
            });
          }

          setStatus('success');
          setMessage(`${extracted.length} lead${extracted.length > 1 ? 's' : ''} lagret!`);
          setTimeout(() => setStatus('idle'), 3000);
        } catch (err: any) {
          console.error("Feil under AI-analyse:", err);
          setStatus('error');
          setMessage(err.message || 'AI-analyse feilet.');
        }
      };
      reader.onerror = () => {
        console.error("Feil ved lesing av fil.");
        setStatus('error');
        setMessage('Kunne ikke lese bildet.');
      }
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Feil ved filopplasting:", error);
      setStatus('error');
      setMessage(error.message || 'Kunne ikke lese bildet.');
    }

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const getButtonClass = () => {
    switch (status) {
      case 'uploading': return 'uploading';
      case 'success': return 'success';
      case 'error': return 'error';
      default: return 'idle';
    }
  }

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
        className={`lead-scanner-button ${getButtonClass()}`}
      >
        {status === 'idle' && <><Camera className="icon" /> SCAN LEAD FORM</>}
        {status === 'uploading' && <><Loader2 className="icon animate-spin" /> {message}</>}
        {status === 'success' && <><CheckCircle className="icon" /> {message}</>}
        {status === 'error' && <><AlertTriangle className="icon" /> {message}</>}
      </button>
    </div>
  );
};
