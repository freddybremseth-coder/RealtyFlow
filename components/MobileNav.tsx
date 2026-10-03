import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Megaphone,
  FileText,
  Euro,
  Settings2,
  MoreHorizontal,
  X,
} from 'lucide-react';

const PRIMARY_ITEMS = [
  { label: 'Hjem', icon: <LayoutDashboard size={20} />, path: '/' },
  { label: 'Sales', icon: <BriefcaseBusiness size={20} />, path: '/workspace/sales' },
  { label: 'Marketing', icon: <Megaphone size={20} />, path: '/workspace/marketing' },
  { label: 'Content', icon: <FileText size={20} />, path: '/workspace/content' },
];

const MORE_ITEMS = [
  { label: 'Finance', icon: <Euro size={22} />, path: '/workspace/finance' },
  { label: 'Platform', icon: <Settings2 size={22} />, path: '/workspace/platform' },
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
            onClick={event => event.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Flere arbeidsområder</span>
              <button onClick={() => setShowMore(false)} className="text-slate-500 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MORE_ITEMS.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-4 rounded-2xl transition-all ${
                      isActive ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-950/50 text-slate-400 hover:bg-slate-800'
                    }`
                  }
                >
                  {item.icon}
                  <span className="text-xs font-bold uppercase tracking-tight">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-2 py-1">
        <div className="flex justify-around items-center h-14">
          {PRIMARY_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive ? 'text-cyan-400' : 'text-slate-500'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-cyan-500/10' : ''}`}>{item.icon}</div>
                  <span className="text-[9px] font-bold uppercase tracking-tighter mt-0.5">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => setShowMore(value => !value)}
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
