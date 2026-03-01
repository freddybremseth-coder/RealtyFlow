
import React, { useState } from 'react';
import { gemini } from '../services/claudeService';
import { Sparkles, Download, RefreshCcw, Image as ImageIcon, Wand2, Maximize2 } from 'lucide-react';

const ImageStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("16:9");

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const url = await gemini.generateMarketingImage(prompt, aspectRatio);
      setGeneratedImage(url);
    } catch (err) {
      console.error(err);
      alert('Generation error.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl lg:text-4xl font-bold neon-text text-cyan-400 mb-1">Studio</h1>
        <p className="text-xs lg:text-sm text-slate-400">High-fidelity visualization for Mediterranean real estate.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-4 space-y-4 lg:space-y-6 order-2 lg:order-1">
          <div className="glass p-5 lg:p-6 rounded-[2rem] border border-slate-800 flex flex-col">
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest ml-1">Visualization Prompt</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Minimalist villa in Altea, sunset Mediterranean lighting..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-all min-h-[140px] resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest ml-1">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["1:1", "16:9", "9:16"] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-3 rounded-xl text-[10px] font-bold border transition-all ${
                        aspectRatio === ratio 
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 text-[10px] text-slate-400 italic leading-relaxed">
                <Sparkles size={12} className="text-cyan-400 inline mr-2" />
                Specify lighting (golden hour, soft dusk) and materials (stone, glass) for best results.
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="mt-6 w-full py-4 lg:py-5 bg-cyan-500 text-slate-950 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-500/20 disabled:opacity-50"
            >
              {isGenerating ? <RefreshCcw className="animate-spin" size={20} /> : <Wand2 size={20} />}
              {isGenerating ? 'Synthesizing...' : 'Generate Asset'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 order-1 lg:order-2">
          <div className="glass h-[300px] sm:h-[450px] lg:h-full rounded-[2.5rem] border border-slate-800 flex flex-col overflow-hidden min-h-[300px] relative">
            {generatedImage ? (
              <div className="relative h-full bg-slate-950 group">
                <img src={generatedImage} alt="Gen" className="w-full h-full object-contain" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <a href={generatedImage} download="asset.png" className="p-3 bg-slate-950/80 rounded-full text-white border border-white/10 hover:bg-cyan-500 transition-colors shadow-2xl">
                    <Download size={20} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700 bg-slate-950/50 p-8 text-center">
                <ImageIcon size={48} className="mb-4 opacity-10" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 max-w-[200px]">
                  {isGenerating ? "Gemini is building your vision..." : "Provide a prompt to create visuals"}
                </p>
                {isGenerating && (
                  <div className="mt-6 flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageStudio;
