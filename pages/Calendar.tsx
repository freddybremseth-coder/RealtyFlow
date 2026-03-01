
import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentType, AppointmentStatus } from '../types';
import { calendarStore } from '../services/calendarService';
import {
  CalendarDays, Plus, X, Clock, MapPin, Phone, User,
  CheckCircle2, AlertCircle, XCircle, ChevronLeft, ChevronRight,
  Home, Video, PhoneCall, ClipboardList, Star, Loader2
} from 'lucide-react';

const TYPE_CONFIG: Record<AppointmentType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  [AppointmentType.VIEWING]:   { label: 'Visning',         color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/30',    icon: <Home size={14} /> },
  [AppointmentType.MEETING]:   { label: 'Møte',            color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <Video size={14} /> },
  [AppointmentType.CALL]:      { label: 'Telefonmøte',     color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/30', icon: <PhoneCall size={14} /> },
  [AppointmentType.VALUATION]: { label: 'Verdivurdering',  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',  icon: <ClipboardList size={14} /> },
  [AppointmentType.SIGNING]:   { label: 'Signeringsmøte',  color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/30', icon: <Star size={14} /> },
  [AppointmentType.OTHER]:     { label: 'Annet',           color: 'text-slate-400',   bg: 'bg-slate-800 border-slate-700',         icon: <CalendarDays size={14} /> },
};

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  [AppointmentStatus.CONFIRMED]: { label: 'Bekreftet',  color: 'text-emerald-400', icon: <CheckCircle2 size={12} /> },
  [AppointmentStatus.PENDING]:   { label: 'Venter',     color: 'text-amber-400',   icon: <AlertCircle size={12} /> },
  [AppointmentStatus.COMPLETED]: { label: 'Fullført',   color: 'text-slate-500',   icon: <CheckCircle2 size={12} /> },
  [AppointmentStatus.CANCELLED]: { label: 'Kansellert', color: 'text-red-400',     icon: <XCircle size={12} /> },
};

const EMPTY_FORM = {
  title: '', type: AppointmentType.VIEWING, date: '', time: '', duration: '60',
  location: '', notes: '', status: AppointmentStatus.CONFIRMED,
  contactName: '', contactPhone: '',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const MONTH_NAMES_NO = ['Januar','Februar','Mars','April','Mai','Juni','Juli','August','September','Oktober','November','Desember'];
const DAY_NAMES_NO = ['Man','Tir','Ons','Tor','Fre','Lør','Søn'];

const Calendar: React.FC = () => {
  const now = new Date();
  const [appointments, setAppointments] = useState<Appointment[]>(calendarStore.getAppointments());
  const [selectedDate, setSelectedDate] = useState<string>(now.toISOString().split('T')[0]);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, date: now.toISOString().split('T')[0] });

  useEffect(() => {
    return calendarStore.subscribe(() => setAppointments(calendarStore.getAppointments()));
  }, []);

  const todayStr = now.toISOString().split('T')[0];

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = (getFirstDayOfMonth(viewYear, viewMonth) + 6) % 7; // Convert Sun=0 to Mon=0

  const apptsByDate = appointments.reduce<Record<string, Appointment[]>>((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {});

  const selectedDayAppts = (apptsByDate[selectedDate] || []).sort((a, b) => a.time.localeCompare(b.time));
  const todayAppts = (apptsByDate[todayStr] || []).sort((a, b) => a.time.localeCompare(b.time));

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const appt: Appointment = {
      id: `cal-${Date.now()}`,
      title: form.title,
      type: form.type,
      date: form.date,
      time: form.time,
      duration: parseInt(form.duration) || 60,
      location: form.location || undefined,
      notes: form.notes || undefined,
      status: form.status,
      contactName: form.contactName || undefined,
      contactPhone: form.contactPhone || undefined,
      createdAt: new Date().toISOString(),
    };
    calendarStore.addAppointment(appt);
    setIsFormOpen(false);
    setForm({ ...EMPTY_FORM, date: selectedDate });
    setTimeout(() => setIsSaving(false), 300);
  };

  const handleDelete = (id: string) => {
    if (confirm('Slett denne avtalen?')) {
      calendarStore.removeAppointment(id);
      if (selectedAppt?.id === id) setSelectedAppt(null);
    }
  };

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    calendarStore.updateAppointment(id, { status });
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-1">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold neon-text text-cyan-400">Kalender</h1>
          <p className="text-slate-400 text-xs mt-1">{todayAppts.length} avtaler i dag · {appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length} bekreftet</p>
        </div>
        <button
          onClick={() => { setForm({ ...EMPTY_FORM, date: selectedDate }); setIsFormOpen(true); }}
          className="px-6 py-3 bg-cyan-500 text-slate-950 rounded-2xl font-bold flex items-center gap-2 text-xs shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all"
        >
          <Plus size={16} /> Ny Avtale
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 glass p-6 rounded-3xl border border-slate-800">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-white">{MONTH_NAMES_NO[viewMonth]} {viewYear}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES_NO.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest py-2">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasAppts = (apptsByDate[dateStr] || []).length > 0;
              const apptCount = (apptsByDate[dateStr] || []).length;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-medium transition-all relative ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                      : isToday
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {day}
                  {hasAppts && !isSelected && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isToday ? 'bg-cyan-400' : 'bg-indigo-400'}`} />
                  )}
                  {hasAppts && isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full mt-0.5 bg-slate-950 opacity-60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day schedule */}
        <div className="glass p-6 rounded-3xl border border-slate-800 flex flex-col">
          <h3 className="text-sm font-bold text-slate-300 mb-1">
            {selectedDate === todayStr ? 'I dag' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <p className="text-[10px] text-slate-600 mb-4">{selectedDayAppts.length} avtale{selectedDayAppts.length !== 1 ? 'r' : ''}</p>

          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
            {selectedDayAppts.length === 0 && (
              <div className="text-center py-10 opacity-30">
                <CalendarDays size={36} className="mx-auto mb-3" />
                <p className="text-xs font-mono uppercase">Ingen avtaler</p>
              </div>
            )}
            {selectedDayAppts.map(appt => {
              const typeCfg   = TYPE_CONFIG[appt.type];
              const statusCfg = STATUS_CONFIG[appt.status];
              return (
                <div
                  key={appt.id}
                  onClick={() => setSelectedAppt(appt)}
                  className={`p-4 rounded-2xl border cursor-pointer hover:brightness-110 transition-all ${typeCfg.bg}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={typeCfg.color}>{typeCfg.icon}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${typeCfg.color}`}>{typeCfg.label}</span>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-bold ${statusCfg.color}`}>
                      {statusCfg.icon} {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mt-2">{appt.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={10} /> {appt.time} · {appt.duration} min</span>
                  </div>
                  {appt.contactName && (
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <User size={10} /> {appt.contactName}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => { setForm({ ...EMPTY_FORM, date: selectedDate }); setIsFormOpen(true); }}
            className="mt-4 w-full py-3 border border-slate-700 rounded-2xl text-xs font-bold text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Legg til avtale
          </button>
        </div>
      </div>

      {/* Appointment detail panel */}
      {selectedAppt && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex justify-end animate-in slide-in-from-right duration-300">
          <div className="w-full lg:w-[500px] bg-[#0a0a0c] border-l border-slate-800 h-full flex flex-col shadow-2xl">
            <header className="p-6 sm:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${TYPE_CONFIG[selectedAppt.type].color}`}>
                  {TYPE_CONFIG[selectedAppt.type].label}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedAppt.title}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(selectedAppt.id)} className="p-2 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-xl transition-colors">
                  <X size={18} />
                </button>
                <button onClick={() => setSelectedAppt(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400"><X size={20} /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 custom-scrollbar">
              <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CalendarDays size={15} className="text-slate-500" />
                  {new Date(selectedAppt.date + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Clock size={15} className="text-slate-500" />
                  {selectedAppt.time} · {selectedAppt.duration} minutter
                </div>
                {selectedAppt.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <MapPin size={15} className="text-slate-500" />
                    {selectedAppt.location}
                  </div>
                )}
                {selectedAppt.contactName && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <User size={15} className="text-slate-500" />
                    {selectedAppt.contactName}
                    {selectedAppt.contactPhone && (
                      <a href={`tel:${selectedAppt.contactPhone}`} className="text-cyan-400 text-xs ml-1">{selectedAppt.contactPhone}</a>
                    )}
                  </div>
                )}
              </div>

              {selectedAppt.notes && (
                <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Notater</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{selectedAppt.notes}</p>
                </div>
              )}

              {/* Status actions */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Oppdater Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(AppointmentStatus).map(s => (
                    <button
                      key={s}
                      onClick={() => { handleStatusChange(selectedAppt.id, s); setSelectedAppt({ ...selectedAppt, status: s }); }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        selectedAppt.status === s
                          ? `${STATUS_CONFIG[s].color} bg-slate-800 border-slate-600`
                          : 'text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Appointment Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <header className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarDays className="text-cyan-400" size={20} /> Ny Avtale
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </header>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <input required placeholder="Tittel på avtalen" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
              <div className="grid grid-cols-2 gap-4">
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value as AppointmentType})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                  {Object.values(AppointmentType).map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
                </select>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as AppointmentStatus})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                  {Object.values(AppointmentStatus).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
                <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <input required type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <input type="number" placeholder="Varighet (min)" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <input placeholder="Sted / adresse" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <input placeholder="Kontaktperson" value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <input placeholder="Kontakttelefon" value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
              </div>
              <textarea placeholder="Notater..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[80px]" />
              <button type="submit" disabled={isSaving} className="w-full py-4 bg-cyan-500 text-slate-950 rounded-2xl font-bold text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                Lagre Avtale
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
