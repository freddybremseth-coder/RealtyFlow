/**
 * emailService – sender e-post via Supabase Edge Function → Resend
 *
 * Konfigurasjon hentes fra settingsStore (lagret i localStorage):
 *   - resendApiKey   : din Resend API-nøkkel  (re_xxxx)
 *   - emailFromName  : avsendernavn            ("Freddy – Soleada.no")
 *   - emailFromEmail : avsenderadresse         ("freddy@soleada.no")
 *
 * Edge function URL leses fra VITE_SUPABASE_URL env-variabelen.
 */

import { settingsStore } from './settingsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any).env ?? {};
const SUPABASE_URL = env.VITE_SUPABASE_URL as string;

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  /** Override sender name (falls back to settings) */
  fromName?: string;
  /** Override sender email (falls back to settings) */
  fromEmail?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

async function send(opts: SendEmailOptions): Promise<SendEmailResult> {
  const automation = settingsStore.getAutomation();
  const resendApiKey  = automation.resendApiKey?.trim()    ?? '';
  const fromName      = opts.fromName  ?? automation.emailFromName?.trim()  ?? 'RealtyFlow';
  const fromEmail     = opts.fromEmail ?? automation.emailFromEmail?.trim() ?? '';

  if (!resendApiKey) {
    return {
      success: false,
      error: 'Resend API-nøkkel mangler. Gå til Innstillinger → E-post og legg inn nøkkelen.',
    };
  }

  if (!SUPABASE_URL) {
    return { success: false, error: 'VITE_SUPABASE_URL er ikke satt i .env.local.' };
  }

  const edgeFnUrl = `${SUPABASE_URL}/functions/v1/send-email`;

  try {
    const res = await fetch(edgeFnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
        // Supabase anon key so the edge function gets past auth middleware
        'apikey': env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({
        to:        opts.to,
        subject:   opts.subject,
        text:      opts.text,
        html:      opts.html,
        replyTo:   opts.replyTo,
        fromName,
        fromEmail,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return { success: false, error: data.error ?? `HTTP ${res.status}` };
    }

    return { success: true, id: data.id };
  } catch (err: unknown) {
    return { success: false, error: `Nettverksfeil: ${String(err)}` };
  }
}

export const emailService = { send };
