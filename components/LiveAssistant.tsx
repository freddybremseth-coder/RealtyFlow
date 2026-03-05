import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLiveAiSession } from '../hooks/useLiveAiSession';
import { LiveAssistantHeader } from './LiveAssistant/LiveAssistantHeader';
import { MessageHistory } from './LiveAssistant/MessageHistory';
import { CommandChips } from './LiveAssistant/CommandChips';
import { TextInputForm } from './LiveAssistant/TextInputForm';
import { MonitorPanel } from './LiveAssistant/MonitorPanel';
import './LiveAssistant.css';

const LiveAssistant: React.FC = () => {
  const {
    isActive,
    isConnecting,
    status,
    logs,
    transcription,
    startSession,
    stopSession,
    sendText,
  } = useLiveAiSession();

  const [textInput, setTextInput] = useState('');

  const handleSendText = (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const message = typeof e === 'string' ? e : textInput;
    sendText(message);
    setTextInput('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-stretch">
        <div className="lg:col-span-9 flex flex-col space-y-4 sm:space-y-6">
          <div className="glass rounded-2xl sm:rounded-[3.5rem] border border-slate-800 overflow-hidden flex flex-col h-[calc(100svh-180px)] sm:h-[750px] shadow-3xl relative bg-slate-950/20 backdrop-blur-2xl">
            <LiveAssistantHeader
              isActive={isActive}
              status={status}
              isConnecting={isConnecting}
              stopSession={stopSession}
              startSession={startSession}
            />

            <div className="flex-1 flex flex-col p-3 sm:p-10 relative overflow-hidden">
              <div className={`absolute inset-0 bg-cyan-500/[0.03] blur-[150px] pointer-events-none transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
              <MessageHistory
                transcription={transcription}
                status={status}
                isActive={isActive}
                isConnecting={isConnecting}
              />
            </div>

            <footer className="p-3 sm:p-10 border-t border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-3 sm:space-y-8 relative z-10">
              <CommandChips handleSendText={handleSendText} />
              <TextInputForm
                textInput={textInput}
                setTextInput={setTextInput}
                handleSendText={handleSendText}
                isConnecting={isConnecting}
              />
            </footer>
          </div>
        </div>

        <div className="hidden lg:flex lg:col-span-3 space-y-6 flex-col h-[750px]">
          <MonitorPanel logs={logs} />
          <div className="p-8 bg-cyan-500/5 border border-cyan-500/10 rounded-[3rem] text-center shadow-inner">
            <Sparkles className="mx-auto text-cyan-500 mb-4 opacity-50" size={32} />
            <p className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-[0.4em]">Encrypted Engine</p>
            <p className="text-[8px] text-slate-700 mt-2 uppercase tracking-widest leading-relaxed">V4.0 Real-time Multimodal Context</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;
