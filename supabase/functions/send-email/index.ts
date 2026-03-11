// Supabase Edge Function – send transactional email via Resend
// Deploy:  supabase functions deploy send-email
// Secrets: supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
//
// The function also accepts the API key in the Authorization header
// (Bearer <key>) so the frontend can pass a user-configured key
// without needing a redeploy.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

interface SendEmailPayload {
  to: string;          // recipient address
  subject: string;
  text: string;        // plain-text body
  html?: string;       // optional HTML body
  fromName?: string;   // e.g. "Freddy – Soleada.no"
  fromEmail?: string;  // e.g. "freddy@soleada.no"  (must be verified in Resend)
  replyTo?: string;
}

Deno.serve(async (req) => {
  // Pre-flight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Resolve API key: header takes precedence over env secret
  const authHeader = req.headers.get('Authorization') ?? '';
  const keyFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const resendKey = (keyFromHeader || Deno.env.get('RESEND_API_KEY')) ?? '';

  if (!resendKey) {
    return json({
      error: 'Mangler RESEND_API_KEY. Legg til nøkkelen i Innstillinger → E-post eller som Supabase-hemmelighet.',
    }, 400);
  }

  let payload: SendEmailPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Ugyldig JSON i forespørselen.' }, 400);
  }

  const { to, subject, text, html, fromName, fromEmail, replyTo } = payload;

  if (!to || !subject || !text) {
    return json({ error: 'Påkrevde felt mangler: to, subject, text.' }, 400);
  }

  const senderName  = fromName  ?? 'RealtyFlow';
  const senderEmail = fromEmail ?? 'onboarding@resend.dev'; // Resend test sender

  const resendPayload = {
    from: `${senderName} <${senderEmail}>`,
    to: [to],
    subject,
    text,
    ...(html ? { html } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend error:', result);
      return json({
        error: result?.message ?? `Resend feil: HTTP ${response.status}`,
        details: result,
      }, response.status);
    }

    return json({ success: true, id: result.id });
  } catch (err) {
    console.error('Nettverksfeil mot Resend:', err);
    return json({ error: `Nettverksfeil: ${String(err)}` }, 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
