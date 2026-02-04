
import React, { useState } from 'react';
import { authStore } from '../services/authService';
import { 
  Zap, Lock, Mail, Loader2, ArrowRight, ShieldCheck, 
  Sparkles, AlertCircle, X, CheckCircle2
} from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const success = await authStore.login(email, password);
    if (!success) {
      setError("Ugyldig brukernavn eller passord. Vennligst sjekk detaljene dine.");
      setIsLoading(false);
    } else {
      // App.tsx vil fange opp endringen via authStore.subscribe
      window.location.hash = "/";
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await authStore.resetPassword(forgotEmail);
    setResetSent(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Bakgrunns-effekter */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10 space-y-4">
          <div className="w-20 h-20 bg-cyan-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-cyan-500/20 neon-border animate-pulse">
            <Zap className="text-white" size={40} fill="white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter uppercase mb-1">RealtyFlow AI</h1>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-[0.3em]">Executive Access Required</p>
          </div>
        </div>

        <div className="glass p-10 lg:p-12 rounded-[3.5rem] border border-slate-800 shadow-3xl bg-slate-900/20 backdrop-blur-3xl relative">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Bruker-ID</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="freddy.bremseth@gmail.com"
                    required
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all placeholder:text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sikkerhetskode</label>
                  <button type="button" onClick={() => setShowForgot(true)} className="text-[10px] font-bold text-slate-600 hover:text-cyan-400 uppercase tracking-widest transition-colors">Glemt?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors" size={20} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all placeholder:text-slate-800"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs animate-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-6 bg-cyan-500 text-slate-950 rounded-[2rem] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-cyan-400 shadow-2xl shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>Initiate Access <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-800/50 flex items-center justify-center gap-6">
             <div className="flex items-center gap-2 opacity-30">
                <ShieldCheck size={14} className="text-cyan-400" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">SSL Encrypted</span>
             </div>
             <div className="flex items-center gap-2 opacity-30">
                <Sparkles size={14} className="text-indigo-400" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Gemini V4 Enabled</span>
             </div>
          </div>
        </div>
      </div>

      {/* GLEMT PASSORD MODAL */}
      {showForgot && (
        <div className="fixed inset-0 z-[600] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <header className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">Gjenoppretting</h3>
                <button onClick={() => { setShowForgot(false); setResetSent(false); }} className="text-slate-500 hover:text-white p-2 bg-slate-950 rounded-full border border-slate-800"><X size={20} /></button>
              </header>
              <div className="p-10 space-y-8">
                 {resetSent ? (
                   <div className="text-center space-y-6 py-4 animate-in fade-in">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                         <CheckCircle2 size={32} />
                      </div>
                      <div className="space-y-2">
                         <h4 className="text-lg font-bold text-white">Lenke er sendt!</h4>
                         <p className="text-sm text-slate-500 leading-relaxed">Sjekk innboksen til <strong>{forgotEmail}</strong> for instruksjoner om gjenoppretting.</p>
                      </div>
                      <button onClick={() => setShowForgot(false)} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-700">Gå tilbake</button>
                   </div>
                 ) : (
                   <form onSubmit={handleReset} className="space-y-6">
                      <p className="text-sm text-slate-500 leading-relaxed">Skriv inn din e-postadresse, så sender vi deg en unik lenke for å oppdatere din sikkerhetskode.</p>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">E-postadresse</label>
                        <input 
                          type="email" 
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="freddy.bremseth@gmail.com"
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 outline-none focus:border-cyan-500"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all"
                      >
                         {isLoading ? <Loader2 className="animate-spin" /> : "Send Gjenopprettings-lenke"}
                      </button>
                   </form>
                 )}
              </div>
           </div>
        </div>
      )}

      <style>{`
        .shadow-3xl {
          box-shadow: 0 0 120px rgba(0,0,0,0.9);
        }
      `}</style>
    </div>
  );
};

export default Login;
