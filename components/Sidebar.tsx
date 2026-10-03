import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Megaphone,
  FileText,
  Euro,
  Settings2,
  Zap,
  MapPin,
  Database,
  CloudUpload,
  LogOut,
} from 'lucide-react';
import { isCloudConnected } from '../services/supabase';
import { settingsStore } from '../services/settingsService';
import { authStore } from '../services/authService';
import { AdvisorProfile } from '../types';
import { useTranslation } from '../services/i18n';

const Sidebar: React.FC = () => {
  const [profile, setProfile] = useState<AdvisorProfile>(settingsStore.getProfile());
  const [lang, setLang] = useState(settingsStore.getLanguage());
  const t = useTranslation(lang);

  useEffect(() => {
    const unsub = settingsStore.subscribe(() => {
      setProfile(settingsStore.getProfile());
      setLang(settingsStore.getLanguage());
    });
    return unsub;
  }, []);

  const navigationItems = [
    { label: t.nav_dashboard || 'Hjem', icon: <LayoutDashboard size={20} />, path: '/' },
    { label: 'Sales', icon: <BriefcaseBusiness size={20} />, path: '/workspace/sales' },
    { label: 'Marketing', icon: <Megaphone size={20} />, path: '/workspace/marketing' },
    { label: 'Content', icon: <FileText size={20} />, path: '/workspace/content' },
    { label: 'Finance', icon: <Euro size={20} />, path: '/workspace/finance' },
    { label: 'Platform', icon: <Settings2 size={20} />, path: '/workspace/platform' },
  ];

  const handleLogout = () => {
    if (confirm('Are you sure?')) {
      authStore.logout();
      window.location.hash = '/login';
    }
  };

  return (
    <aside className="hidden lg:flex w-64 flex-shrink-0 bg-slate-950 border-r border-slate-800 flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center neon-border">
          <Zap className="text-white" size={24} fill="white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tighter neon-text text-cyan-400">RealtyFlow</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Platform</p>
        </div>
      </div>

      <div className="px-6 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Arbeidsområder</p>
      </div>

      <nav className="flex-1 px-4 py-3 space-y-1">
        {navigationItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto space-y-3">
        <div className={`px-4 py-2 rounded-xl border flex items-center justify-between transition-all ${isCloudConnected ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center gap-2">
            {isCloudConnected ? <CloudUpload size={14} className="text-emerald-500" /> : <Database size={14} className="text-slate-600" />}
            <span className={`text-[9px] font-bold uppercase tracking-widest ${isCloudConnected ? 'text-emerald-500' : 'text-slate-600'}`}>
              {isCloudConnected ? 'Shared Core online' : 'Local Mode'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold overflow-hidden">
              {profile.imageUrl ? <img src={profile.imageUrl} className="w-full h-full object-cover" /> : <span>{profile.name[0]}</span>}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">{profile.name}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <MapPin size={8} /> {profile.location.split(',')[0]}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors w-full pt-2 border-t border-slate-800/50"
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
