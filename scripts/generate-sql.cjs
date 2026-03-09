#!/usr/bin/env node
// generate-sql.cjs
// Leser full-output.csv og skriver leads-insert.sql

const fs = require('fs');

function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rows = [];
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    let q = (line.match(/"/g) || []).length;
    while (q % 2 !== 0 && i + 1 < lines.length) {
      i++; line += '\n' + lines[i];
      q = (line.match(/"/g) || []).length;
    }
    const fields = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ';' && !inQ) { fields.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    fields.push(cur.trim());
    if (fields.some(f => f)) rows.push(fields);
    i++;
  }
  return rows;
}

function sq(s) {
  // SQL-sikkert: erstatt ' med ''
  return (s || '').replace(/'/g, "''");
}

// Norsk tall-parsing: "3,5" → 3.5, "350 000" → 350000
function parseNorwegianNumber(s) {
  // Fjern mellomrom (tusenskiller), erstatt komma med punktum (desimal)
  return parseFloat(s.replace(/\s/g, '').replace(',', '.')) || 0;
}

// Prøv å hente budsjett-tall (EUR) fra budsjett-tekst
function parseBudgetEur(txt) {
  if (!txt) return 0;
  // "550 k EUR" / "600K" → direkte i EUR
  const kEur = txt.match(/(\d[\d\s,.]*)[\s]*[kK][\s]*(?:EUR|euro|€)/i);
  if (kEur) return Math.round(parseNorwegianNumber(kEur[1]) * 1000);
  // "350 000 euro" / "400 000 eur"
  const eur = txt.match(/(\d[\d\s,.]{2,})\s*(?:euro|EUR|€)/i);
  if (eur) return Math.round(parseNorwegianNumber(eur[1].replace(/\s/g,'')));
  // "5 mill NOK" / "3,5 MNOK" → omregn til EUR (kurs ~10)
  const millNok = txt.match(/(\d[\d\s,.]*)\s*(?:mill(?:ioner)?|mnok)/i);
  if (millNok) return Math.round(parseNorwegianNumber(millNok[1]) * 100000);
  // "550 k" (ukjent valuta, antar EUR)
  const k = txt.match(/(\d[\d\s,.]*)\s*[kK]\b/);
  if (k) return Math.round(parseNorwegianNumber(k[1]) * 1000);
  return 0;
}

// Rens navn: fjern parenteser og tekst etter " - "
function cleanName(navn) {
  return navn
    .replace(/\s*\(.*?\)/g, '')   // fjern (...)
    .replace(/\s+[-–]\s+.*$/, '') // fjern " - resten"
    .trim();
}

const content = fs.readFileSync('/home/user/RealtyFlow/scripts/full-output.csv', 'utf-8').replace(/^\uFEFF/, '');
const rows = parseCSV(content);
const header = rows[0]; // Navn;E-post;Telefon;Budsjett;Lokasjon;Notater

const lines = [
  '-- ─────────────────────────────────────────────────────────────────────────────',
  '-- Event-leads import — generert automatisk',
  '-- Kjør i: Supabase Dashboard → SQL Editor',
  '-- ─────────────────────────────────────────────────────────────────────────────',
  '',
  'INSERT INTO leads',
  '  (name, first_name, last_name, email, phone, source, status, value,',
  '   sentiment, urgency, intent, last_activity, summary, requirements)',
  'VALUES',
];

const values = [];

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const navnRaw  = (r[0] || '').trim();
  const epost    = (r[1] || '').trim();
  const tlf      = (r[2] || '').trim();
  const budsjett = (r[3] || '').trim();
  const lokasjon = (r[4] || '').trim();
  const notat    = (r[5] || '').trim();

  const navn = cleanName(navnRaw);
  if (!navn) continue;

  const parts = navn.split(/\s+/);
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
  const lastName  = parts.length > 1 ? parts[parts.length - 1] : '';

  const value = parseBudgetEur(budsjett);

  const summary = [
    notat,
    budsjett ? `Budsjett: ${budsjett}` : '',
    lokasjon ? `Lokasjon: ${lokasjon}` : '',
  ].filter(Boolean).join(' | ').slice(0, 500);

  const req = JSON.stringify({
    ...(budsjett ? { budget_text: budsjett } : {}),
    ...(lokasjon ? { location: lokasjon }    : {}),
  });

  values.push(
    `  ('${sq(navn)}', '${sq(firstName)}', '${sq(lastName)}', '${sq(epost)}', '${sq(tlf)}', ` +
    `'Event Import', 'NEW', ${value}, 50, 50, 50, NOW()::text, '${sq(summary)}', '${sq(req)}'::jsonb)`
  );
}

lines.push(values.join(',\n'));
lines.push('ON CONFLICT DO NOTHING;');
lines.push('');
lines.push(`-- ${values.length} leads totalt`);

const sql = lines.join('\n');
fs.writeFileSync('/home/user/RealtyFlow/scripts/leads-insert.sql', sql, 'utf-8');
console.log(`✓ ${values.length} INSERT-rader skrevet til leads-insert.sql`);
