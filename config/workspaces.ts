export type WorkspaceId = 'sales' | 'marketing' | 'content' | 'finance' | 'platform';

export interface WorkspaceModule {
  label: string;
  path: string;
  description: string;
}

export interface WorkspaceDefinition {
  id: WorkspaceId;
  label: string;
  description: string;
  modules: WorkspaceModule[];
}

export const WORKSPACES: WorkspaceDefinition[] = [
  {
    id: 'sales',
    label: 'Sales',
    description: 'Leads, kunder, eiendommer og salgsoppfølging.',
    modules: [
      { label: 'Pipeline', path: '/pipeline', description: 'Følg leads gjennom salgsprosessen.' },
      { label: 'Kunder', path: '/crm', description: 'Kundekort, historikk og oppfølging.' },
      { label: 'Kalender', path: '/calendar', description: 'Visninger, møter, samtaler og avtaler.' },
      { label: 'Boliger', path: '/inventory', description: 'Eiendomsoversikt og tilgjengelighet.' },
      { label: 'Tomtebase', path: '/tomtebase', description: 'Tomter og utviklingsmuligheter.' },
      { label: 'Verdivurdering', path: '/valuation', description: 'Verdivurdering og salgsgrunnlag.' },
      { label: 'Lead Scanner', path: '/scanner', description: 'Opprett leads fra dokumenter og bilder.' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Kampanjer, vekst, distribusjon og markedsoppgaver.',
    modules: [
      { label: 'Growth Hub', path: '/growth', description: 'Vekstsignaler og markedstiltak.' },
      { label: 'Markedsoppgaver', path: '/marketing-tasks', description: 'Planlegg og gjennomfør markedsarbeid.' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    description: 'Artikler, bilder, video og publiserbart innhold.',
    modules: [
      { label: 'Content Studio', path: '/content', description: 'Lag og administrer innhold.' },
      { label: 'Image Studio', path: '/studio', description: 'Bilder og visuelle produksjoner.' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Inntekter, kostnader, provisjon, ROI og lønnsomhet.',
    modules: [
      { label: 'Business Overview', path: '/business', description: 'Forretningsoversikt og nøkkeltall.' },
      { label: 'Business Hub', path: '/hub', description: 'Operativ forretningsoppfølging.' },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    description: 'Nexus, integrasjoner, automasjoner og innstillinger.',
    modules: [
      { label: 'Nexus / Assistent', path: '/assistant', description: 'AI-assistent og plattformstøtte.' },
      { label: 'Innstillinger', path: '/settings', description: 'Profil, integrasjoner og systemoppsett.' },
    ],
  },
];

export const WORKSPACE_BY_ID = Object.fromEntries(
  WORKSPACES.map(workspace => [workspace.id, workspace])
) as Record<WorkspaceId, WorkspaceDefinition>;
