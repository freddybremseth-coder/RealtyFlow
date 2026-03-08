// ─────────────────────────────────────────────────────────────────────────────
// Supabase Edge Function – Webhook Receiver for RealtyFlow Hub
// Deploy: supabase functions deploy webhooks
//
// Støttede ruter (POST):
//   /functions/v1/webhooks/real-estate
//   /functions/v1/webhooks/ecommerce
//   /functions/v1/webhooks/technology
//   /functions/v1/webhooks/brand
//
// Automatiske env-variabler (ingen secrets-oppsett nødvendig):
//   SUPABASE_URL              – prosjektets URL
//   SUPABASE_SERVICE_ROLE_KEY – bypasser RLS, kun server-side
// ─────────────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

// Gyldige webhook-typer og tilhørende brand-ID
const ROUTE_MAP: Record<string, { type: string; brandId: string; sourceName: string }> = {
  'real-estate': { type: 'real-estate', brandId: 'soleada',   sourceName: 'ZenecoHomes'     },
  'ecommerce':   { type: 'ecommerce',   brandId: 'donaanna',  sourceName: 'DonaAnna'        },
  'technology':  { type: 'tech',        brandId: 'chatgenius',sourceName: 'ChatGenius'      },
  'brand':       { type: 'brand',       brandId: 'freddy',    sourceName: 'PersonalBrand'   },
};

// ─── Payload-typer per rute ───────────────────────────────────────────────────

interface BasePayload {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

interface RealEstatePayload extends BasePayload {
  budget?: number | string;
  propertyType?: string;
  location?: string;
  readiness?: string;        // "Klar nå" | "3–6 måneder" | osv.
  bedrooms?: number;
  interests?: string[];
}

interface EcommercePayload extends BasePayload {
  interests?: string[];      // produkter kunden er interessert i
  orderValue?: number;
  coupon?: string;
}

interface TechnologyPayload extends BasePayload {
  company?: string;
  projectType?: string;      // "Nettside" | "App" | "AI-integrasjon" | osv.
  timeline?: string;
  budget?: number | string;
}

interface BrandPayload extends BasePayload {
  company?: string;
  collaborationType?: string; // "Sponsing" | "Foredrag" | osv.
  reach?: string;
}

type IncomingPayload = RealEstatePayload & EcommercePayload & TechnologyPayload & BrandPayload;

// ─── Hjelpefunksjoner ────────────────────────────────────────────────────────

function extractRouteSegment(url: URL): string | null {
  // Matcher /functions/v1/webhooks/<segment>
  const match = url.pathname.match(/\/webhooks\/([^/?]+)/);
  return match ? match[1] : null;
}

function buildLeadRow(
  route: typeof ROUTE_MAP[string],
  payload: IncomingPayload,
): Record<string, unknown> {
  const { name, email, phone, message, budget, ...rest } = payload;

  // Bygg requirements-objekt (brukes av CRM-visningen)
  const requirements: Record<string, unknown> = {};
  if (budget)                requirements.budget       = typeof budget === 'string' ? parseFloat(budget) || 0 : budget;
  if (payload.location)      requirements.location     = payload.location;
  if (payload.propertyType)  requirements.propertyType = payload.propertyType;
  if (payload.bedrooms)      requirements.bedrooms     = payload.bedrooms;

  // Samle alle dynamiske felt i extra_data
  const extra: Record<string, unknown> = {};
  const knownFields = new Set(['name','email','phone','message','budget','location','propertyType','bedrooms']);
  for (const [k, v] of Object.entries(rest)) {
    if (!knownFields.has(k) && v !== undefined && v !== null && v !== '') {
      extra[k] = v;
    }
  }

  // Bygg summary-tekst for CRM-oversikten
  const summaryParts: string[] = [];
  if (payload.propertyType) summaryParts.push(`Søker ${payload.propertyType}`);
  if (payload.location)     summaryParts.push(`i ${payload.location}`);
  if (budget)               summaryParts.push(`• Budsjett: ${budget}`);
  if (payload.company)      summaryParts.push(`• Firma: ${payload.company}`);
  if (payload.projectType)  summaryParts.push(`• Prosjekttype: ${payload.projectType}`);
  if (payload.interests?.length) summaryParts.push(`• Interesser: ${payload.interests.join(', ')}`);
  if (message)              summaryParts.push(`\n"${message.slice(0, 200)}"`);

  return {
    name:         name    ?? 'Ukjent',
    email:        email   ?? null,
    phone:        phone   ?? null,
    source:       route.sourceName,
    type:         route.type,
    brand_id:     route.brandId,
    message:      message ?? null,
    status:       'NEW',
    sentiment:    60,
    urgency:      50,
    intent:       55,
    value:        typeof budget === 'number' ? budget : (parseFloat(String(budget)) || 0),
    summary:      summaryParts.join(' ') || `Ny ${route.type}-henvendelse`,
    requirements: requirements,
    extra_data:   extra,
    emails:       [],
    last_activity: new Date().toLocaleDateString('no-NO'),
  };
}

// ─── Hoved-handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Pre-flight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Kun POST-forespørsler er tillatt.' }, 405);
  }

  // Finn rute-segment
  const segment = extractRouteSegment(url);
  const route = segment ? ROUTE_MAP[segment] : null;

  if (!route) {
    return json({
      error: `Ugyldig rute. Gyldige: ${Object.keys(ROUTE_MAP).join(', ')}`,
      mottatt: url.pathname,
    }, 404);
  }

  // Parse payload
  let payload: IncomingPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Ugyldig JSON i forespørselen.' }, 400);
  }

  // Hent Supabase-info (auto-tilgjengelig i edge functions)
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Supabase-miljøvariabler mangler.' }, 500);
  }

  // Bygg lead-rad og INSERT via Supabase REST API
  const leadRow = buildLeadRow(route, payload);

  const response = await fetch(`${supabaseUrl}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer':        'return=representation',
    },
    body: JSON.stringify(leadRow),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Supabase insert-feil:', err);
    return json({ error: `Databasefeil: ${err}` }, 500);
  }

  const inserted = await response.json();
  console.log(`✅ Ny lead (${route.type}):`, inserted[0]?.id);

  return json({ success: true, id: inserted[0]?.id, type: route.type });
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
