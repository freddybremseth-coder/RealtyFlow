#!/usr/bin/env node
// parse-event-leads.js
// Bruk: node scripts/parse-event-leads.js event-leads.csv output-leads.csv

const fs = require('fs');

// ─── CSV-parsing (støtter ; som skilletegn + "..." multiline-felter) ──────────

function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rows = [];
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    let quoteCount = (line.match(/"/g) || []).length;
    while (quoteCount % 2 !== 0 && i + 1 < lines.length) {
      i++;
      line += '\n' + lines[i];
      quoteCount = (line.match(/"/g) || []).length;
    }
    const parsed = parseRow(line);
    if (parsed.some(f => f.trim())) rows.push(parsed);
    i++;
  }
  return rows;
}

function parseRow(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ';' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// ─── Navn-heuristikk ─────────────────────────────────────────────────────────

// Ord som ikke er navn
const NON_NAME_WORDS = new Set([
  'og','&','Gode','Veldig','Bra','Ingen','En','Flere','Har','Vi','Mange',
  'Etter','Spam','Ett','De','Som','Var','Vil','Kan','Er','Med','Fra','Til',
  'Alle','Begge','Noen','Bare','Men','Seg','Han','Hun','De','Det','Den',
  'Leads','Lead','Event','Budsjett','Budsjett:','Avtalte','Avtal',
]);

function looksLikeName(text) {
  if (!text) return false;
  const t = text.trim().replace(/\(.*?\)/g, '').trim(); // fjern parentes-innhold
  if (t.length > 70 || t.length < 4) return false;
  // Avvis linjer med typiske setnings-tegn
  if (/[!?:]/.test(t)) return false;
  if (/\d/.test(t)) return false;
  const words = t.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;
  // Filtrer ut konjunksjoner
  const nameWords = words.filter(w => !['og','&','og,','&,'].includes(w.toLowerCase()));
  if (nameWords.length < 2) return false;
  // Avvis hvis første ord er et kjent ikke-navn-ord
  if (NON_NAME_WORDS.has(words[0])) return false;
  // Navn-ord: starter med stor bokstav, og kan inneholde bindestrek (Al-Anini)
  const upperCount = nameWords.filter(w => /^[A-ZÆØÅ][a-zæøåA-ZÆØÅ-]*$/.test(w)).length;
  return upperCount >= Math.ceil(nameWords.length * 0.8);
}

// ─── Splitt "Kai Evjen og Roger Tangen" → ['Kai Evjen', 'Roger Tangen'] ──────

function splitCoupleOrPair(text) {
  // Sjekk om det er "Fornavn Etternavn og Fornavn Etternavn" (to separate)
  // eller "Fornavn og Fornavn Etternavn" (par med samme etternavn)
  const ogMatch = text.match(/^(.+?)\s+(?:og|&)\s+(.+)$/i);
  if (!ogMatch) return [text];
  const [, part1, part2] = ogMatch;
  // Del opp bare om begge delene er navn
  if (looksLikeName(part1) && looksLikeName(part2)) {
    return [part1.trim(), part2.trim()];
  }
  // Hvis bare første del er et navn: "Aileen Strøm (& Jørn Strøm)"
  if (looksLikeName(part1)) return [part1.trim()];
  return [text];
}

// ─── Trekk ut budsjett og lokasjon fra tekst ─────────────────────────────────

function extractBudget(text) {
  const m =
    text.match(/budsjett[:\s]+([^\n.;]{3,50})/i) ||
    text.match(/(\d[\d\s,.]*\s*(?:mill(?:ioner)?|mnok|M NOK))/i) ||
    text.match(/(\d[\d\s,.]*\s*(?:000\s*)?(?:euro|EUR|€))/i) ||
    text.match(/(\d[\d\s,.]*\s*K\s*(?:EUR|euro|NOK))/i);
  return m ? m[1].trim().replace(/\s+/g, ' ') : '';
}

function extractLocation(text) {
  const locations = [
    'CB Nord','CB Sør','Costa Blanca Nord','Costa Blanca Sør',
    'Costa del Sol','CDS','Estepona','Marbella','Torrevieja',
    'Punta Prima','La Zenia','Orihuela Costa','Villamartin',
    'Altea','Fuengirola','Malaga','Manilva','Casares','Alicante',
    'Playa Flamenca','Las Colinas','La Finca',
  ];
  for (const loc of locations) {
    if (text.toLowerCase().includes(loc.toLowerCase())) return loc;
  }
  return '';
}

// ─── Trekk ut navn (+ kontekst) fra en fritekst-blokk ───────────────────────

function extractPeopleFromText(text) {
  const people = [];
  const lines = text.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^[-–•*]\s*/, '');
    if (!line || line.length < 4) continue;

    // "Bra lead på Arne Sæther" / "Lead på X" / "leads på: X"
    const leadPaaMatch = line.match(/(?:lead[s]?\s+p[åa]|lead[s]?:)\s+([A-ZÆØÅ].{2,40}?)(?:\s*[,.]|$)/i);
    if (leadPaaMatch) {
      const namePart = leadPaaMatch[1].trim();
      const names = splitCoupleOrPair(namePart);
      for (const name of names) {
        if (looksLikeName(name)) {
          people.push({ name, note: line, budget: extractBudget(line), location: extractLocation(line) });
        }
      }
      continue;
    }

    // Linje starter med navn etterfulgt av info: "Vidar Torbjørnsen - ønsker..."
    // Lazy match sikrer at vi stopper ved første skilletegn
    const nameLeadMatch = line.match(/^([A-ZÆØÅ][A-Za-zæøåÆØÅ -]{1,35}?)(?:\s*[-–]\s+|\s*:\s+|\s*,\s+)(.+)$/);
    if (nameLeadMatch) {
      const namePart = nameLeadMatch[1].trim();
      const names = splitCoupleOrPair(namePart);
      for (const name of names) {
        if (looksLikeName(name)) {
          people.push({
            name,
            note: line,
            budget: extractBudget(line),
            location: extractLocation(line),
          });
        }
      }
      if (names.some(n => looksLikeName(n))) continue;
    }

    // Hele linjen er et navn (evt. par)
    if (looksLikeName(line)) {
      const names = splitCoupleOrPair(line);
      for (const name of names) {
        if (looksLikeName(name)) {
          people.push({ name, note: '', budget: '', location: '' });
        }
      }
      continue;
    }

    // Linjen inneholder "Leads: Navn og Navn" eller "Veldig bra: Navn"
    const leadsMatch = line.match(/(?:leads?|bra|gode)[^:]*:\s*([A-ZÆØÅ].+)/i);
    if (leadsMatch) {
      const rest = leadsMatch[1];
      const names = splitCoupleOrPair(rest.split(/[.,]/)[0].trim());
      for (const name of names) {
        if (looksLikeName(name)) {
          people.push({
            name,
            note: line,
            budget: extractBudget(line),
            location: extractLocation(line),
          });
        }
      }
    }
  }

  return people;
}

// ─── Hoved-prosessering ───────────────────────────────────────────────────────

function processLeads(inputPath, outputPath) {
  const content = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(content);
  if (rows.length < 2) { console.error('Fant ingen rader.'); return; }

  const header = rows[0];
  const idx = (name) => {
    const i = header.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
    return i === -1 ? -1 : i;
  };
  const navnI   = idx('navn');
  const epostI  = idx('e-post') !== -1 ? idx('e-post') : idx('epost') !== -1 ? idx('epost') : idx('mail');
  const tlfI    = idx('telefon') !== -1 ? idx('telefon') : idx('tlf');
  const noterI  = idx('notat') !== -1 ? idx('notat') : idx('noter') !== -1 ? idx('noter') : idx('melding');

  if (navnI === -1) { console.error('Fant ikke "Navn"-kolonne.'); return; }

  // name (lower) → lead object
  const leads = new Map();

  function upsert(name, email, phone, note, budget, location) {
    const key = name.toLowerCase().trim();
    if (!key || key.length < 3) return;
    if (leads.has(key)) {
      const ex = leads.get(key);
      if (note && !ex.note.includes(note.slice(0, 30)))
        ex.note = [ex.note, note].filter(Boolean).join(' | ');
      if (!ex.email && email)    ex.email    = email;
      if (!ex.phone && phone)    ex.phone    = phone;
      if (!ex.budget && budget)  ex.budget   = budget;
      if (!ex.location && location) ex.location = location;
    } else {
      leads.set(key, {
        name:     name.trim(),
        email:    email    || '',
        phone:    phone    || '',
        note:     note     || '',
        budget:   budget   || '',
        location: location || '',
      });
    }
  }

  for (let i = 1; i < rows.length; i++) {
    const row   = rows[i];
    const navn  = navnI  >= 0 ? (row[navnI]  || '').trim() : '';
    const epost = epostI >= 0 ? (row[epostI] || '').trim() : '';
    const tlf   = tlfI   >= 0 ? (row[tlfI]   || '').trim() : '';
    const noter = noterI >= 0 ? (row[noterI] || '').trim() : '';

    if (looksLikeName(navn)) {
      // Navn-kolonnen er et ekte navn
      const names = splitCoupleOrPair(navn);
      for (const name of names) {
        if (looksLikeName(name)) {
          upsert(name, epost, tlf,
            noter || (navn !== name ? navn : ''),
            extractBudget(navn + ' ' + noter),
            extractLocation(navn + ' ' + noter));
        }
      }
    } else {
      // Navn-kolonnen er en setning eller tom – trekk ut navn fra begge felt
      const combined = [navn, noter].filter(Boolean).join('\n');
      const people   = extractPeopleFromText(combined);
      for (const p of people) {
        upsert(p.name, epost, tlf, p.note, p.budget, p.location);
      }
    }
  }

  // ─── Skriv output ──────────────────────────────────────────────────────────
  const esc = (s) => {
    if (!s) return '';
    return (s.includes(';') || s.includes('"') || s.includes('\n'))
      ? `"${String(s).replace(/"/g, '""')}"` : String(s);
  };

  const csvLines = ['Navn;E-post;Telefon;Budsjett;Lokasjon;Notater'];
  for (const l of leads.values()) {
    csvLines.push([esc(l.name), esc(l.email), esc(l.phone),
                   esc(l.budget), esc(l.location), esc(l.note)].join(';'));
  }

  fs.writeFileSync(outputPath, '\uFEFF' + csvLines.join('\n'), 'utf-8');
  console.log(`✓ ${leads.size} leads skrevet til ${outputPath}`);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

const [,, inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.log('Bruk: node scripts/parse-event-leads.js event-leads.csv output-leads.csv');
  process.exit(1);
}

processLeads(inputPath, outputPath);
