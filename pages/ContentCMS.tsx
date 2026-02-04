
import React, { useState } from 'react';
import { gemini } from '../services/geminiService';
import { FileText, Send, BookOpen, Mail, Sparkles, Copy, Check, Download, RefreshCw, Layout, MousePointer2, HardHat } from 'lucide-react';

type ContentType = 'blog' | 'newsletter' | 'guide' | 'email' | 'presentation' | 'construction';

const ContentCMS: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [brand, setBrand] = useState('soleada');
  const [contentType, setContentType] = useState<ContentType>('blog');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const content = await gemini.generateCMSContent(contentType, topic, brand);
      setGeneratedText(content);
    } catch (err) {
      console.error(err);
      alert('Failed to generate content. Please check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const types: { id: ContentType; icon: React.ReactNode; label: string }[] = [
    { id: 'blog', icon: <FileText size={16} />, label: 'Blog' },
    { id: 'newsletter', icon: <Mail size={16} />, label: 'News' },
    { id: 'guide', icon: <BookOpen size={16} />, label: 'Guide' },
    { id: 'email', icon: <Send size={16} />, label: 'Email' },
    { id: 'presentation', icon: <Layout size={16} />, label: 'Slides' },
    { id: 'construction', icon: <HardHat size={16} />, label: 'Update' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-bold neon-text text-cyan-400 mb-2">AI Content Studio</h1>
        <p className="text-slate-400">Your intelligent generator for marketing, emails, and property presentations.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-3xl border border-slate-800 space-y-6">
            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase mb-3">Target Brand Identity</label>
              <div className="space-y-2">
                {[
                  { id: 'soleada', name: 'Soleada.no', color: 'border-cyan-500/30 text-cyan-400' },
                  { id: 'zeneco', name: 'Zeneco Homes', color: 'border-emerald-500/30 text-emerald-400' },
                  { id: 'pinoso', name: 'Pinoso Eco Life', color: 'border-amber-500/30 text-amber-400' },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBrand(b.id)}
                    className={`w-full p-4 rounded-2xl border text-sm font-bold transition-all flex items-center justify-between ${
                      brand === b.id 
                        ? `${b.color} bg-slate-900 shadow-lg shadow-black` 
                        : 'border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {b.name}
                    {brand === b.id && <div className={`w-2 h-2 rounded-full bg-current shadow-[0_0_8px_currentColor]`} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase mb-3">Content Strategy</label>
              <div className="grid grid-cols-2 gap-2">
                {types.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setContentType(t.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                      contentType === t.id 
                        ? 'bg-cyan-500 border-cyan-400 text-slate-950' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
                {contentType === 'email' ? 'Recipient Context / Inquiry' : 
                 contentType === 'presentation' ? 'Project Name & Key Points' : 
                 contentType === 'construction' ? 'Build Phase (e.g. Foundation, Tiling)' :
                 'Subject / Topic'}
              </label>
              <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={
                  contentType === 'email' ? "e.g., Follow up with Julian about the Altea Hills view..." :
                  contentType === 'presentation' ? "e.g., Zeneco Oasis - 3 Bedroom Sustainable Villas..." :
                  contentType === 'construction' ? "e.g., Phase 2 completion at Zeneco Moraira..." :
                  "e.g., The benefits of buying in Costa Blanca North..."
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all min-h-[120px] resize-none"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !topic}
              className="w-full py-4 bg-cyan-500 text-slate-950 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <HardHat size={20} />}
              {isGenerating ? 'Gemini is Thinking...' : 'Draft Content'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="glass h-full rounded-3xl border border-slate-800 flex flex-col overflow-hidden min-h-[600px]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
              </div>
              <div className="flex gap-2">
                {generatedText && (
                  <>
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2 text-xs font-bold"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button className="p-2 text-slate-400 hover:text-cyan-400 transition-colors">
                      <Download size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 animate-pulse" />
                  </div>
                  <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em]">Crafting professional content...</p>
                </div>
              ) : generatedText ? (
                <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-cyan-400 prose-headings:font-bold prose-p:leading-relaxed whitespace-pre-wrap text-lg">
                  {generatedText}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-700 opacity-20">
                  <MousePointer2 size={60} strokeWidth={1} />
                  <p className="mt-4 font-mono uppercase tracking-[0.3em] text-[10px]">Select brand & strategy to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCMS;
