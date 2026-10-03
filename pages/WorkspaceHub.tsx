import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, Megaphone, FileText, Euro, Settings2 } from 'lucide-react';
import { WORKSPACE_BY_ID, WorkspaceId } from '../config/workspaces';

const ICONS: Record<WorkspaceId, React.ReactNode> = {
  sales: <BriefcaseBusiness size={24} />,
  marketing: <Megaphone size={24} />,
  content: <FileText size={24} />,
  finance: <Euro size={24} />,
  platform: <Settings2 size={24} />,
};

const WorkspaceHub: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: WorkspaceId }>();
  if (!workspaceId || !WORKSPACE_BY_ID[workspaceId]) return <Navigate to="/" replace />;

  const workspace = WORKSPACE_BY_ID[workspaceId];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-400">
          {ICONS[workspace.id]}
          RealtyFlow Workspace
        </div>
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">{workspace.label}</h1>
          <p className="mt-2 max-w-2xl text-slate-400">{workspace.description}</p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workspace.modules.map(module => (
          <Link
            key={module.path}
            to={module.path}
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-100">{module.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{module.description}</p>
              </div>
              <ArrowRight className="mt-1 shrink-0 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400" size={18} />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
};

export default WorkspaceHub;
