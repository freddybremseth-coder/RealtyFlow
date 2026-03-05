import React from 'react';
import { LeadScanner } from '../components/LeadScanner';

const ScannerPage: React.FC = () => {
  return (
    <div className="w-full p-6 lg:p-10 flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Lead Scanner</h2>
        <p className="text-slate-400 text-sm">Ta bilde av et leadskjema eller visittkort for å lagre det automatisk.</p>
      </div>
      <LeadScanner />
    </div>
  );
};

export default ScannerPage;
