import React from 'react';
import { Loader2, SendHorizontal, CornerDownLeft } from 'lucide-react';

interface TextInputFormProps {
  textInput: string;
  setTextInput: (text: string) => void;
  handleSendText: (e: React.FormEvent) => void;
  isConnecting: boolean;
}

export const TextInputForm: React.FC<TextInputFormProps> = ({ textInput, setTextInput, handleSendText, isConnecting }) => {
  return (
    <form onSubmit={handleSendText} className="flex gap-2 sm:gap-5 relative group">
      <div className="flex-1 relative">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Skriv spørsmål her..."
          className="w-full bg-slate-950/90 border-2 border-slate-800 rounded-2xl sm:rounded-[2.5rem] py-4 sm:py-6 px-4 sm:pl-10 sm:pr-20 text-sm sm:text-lg text-slate-100 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-600 shadow-3xl group-focus-within:border-cyan-500/50"
        />
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em]">
            <CornerDownLeft size={12} /> Enter
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={!textInput.trim() && !isConnecting}
        className="p-4 sm:p-6 bg-cyan-500 text-slate-950 rounded-2xl sm:rounded-[2.5rem] font-bold hover:bg-cyan-400 disabled:opacity-20 disabled:grayscale transition-all shadow-2xl shadow-cyan-500/20 active:scale-95 flex items-center justify-center min-w-[52px] sm:min-w-[80px]"
      >
        {isConnecting ? <Loader2 className="animate-spin" size={20} /> : <SendHorizontal size={20} className="sm:hidden" />}
        <SendHorizontal size={32} className="hidden sm:block" />
      </button>
    </form>
  );
};
