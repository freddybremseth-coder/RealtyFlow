
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Home, Mic, MoreHorizontal, X, Map, Rocket, FileText, Image as ImageIcon, Camera, Settings, ClipboardList } from 'lucide-react';

const PRIMARY_ITEMS = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { label: 'Pipeline', icon: <Users size={20} />, path: '/pipeline' },
  { label: 'Inventory', icon: <Home size={20} />, path: '/inventory' },
  { label: 'Assistent', icon: <Mic size={20} />, path: '/assistant' },
];

const MORE_ITEMS = [
  { label: 'Verdivurdering', icon: <ClipboardList size={20} />, path: '/valuation' },
  { label: 'Market Pulse', icon: <Map size={20} />, path: '/market' },
  { label: 'Growth Hub', icon: <Rocket size={20} />, path: '/growth' },
  { label: 'Content Studio', icon: <FileText size={20} />, path: '/content' },
  { label: 'Image Studio', icon: <ImageIcon size={20} />, path: '/studio' },
  { label: 'Lead Scanner', icon: <Camera size={20} />, path: '/scanner' },
  { label: 'Innstillinger', icon: <Settings size={20} />, path: '/settings' },
];

const MobileNav: React.FC = () => {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-[60]" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
          <div
            className="absolute bottom-14 left-0 right-0 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 animate-in slide-in-from-bottom duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alle sider</span>
              <button onClick={() => setShowMore(false)} className="text-slate-500 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MORE_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center p-3 rounded-2xl transition-all gap-1.5 ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
                    }`
                  }
                >
                  {item.icon}
                  <span className="text-[9px] font-bold uppercase tracking-tight text-center leading-tight">
                    {item.label.split(' ')[0]}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-2 py-1">
        <div className="flex justify-around items-center h-14">
          {PRIMARY_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isActive ? 'text-cyan-400' : 'text-slate-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-cyan-500/10' : ''}`}>
                    {item.icon}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-tighter mt-0.5">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => setShowMore(v => !v)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${showMore ? 'text-cyan-400' : 'text-slate-500'}`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${showMore ? 'bg-cyan-500/10' : ''}`}>
              <MoreHorizontal size={20} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tighter mt-0.5">Mer</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
