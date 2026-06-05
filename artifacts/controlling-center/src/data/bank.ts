import type { BankTransaction, EntityCode, SuggestionSource, VendorMapping } from "./types";
import { EXPENSE_BUDGET_CATEGORIES } from "./finance";

export interface ParsedTransaction {
  date: string; // ISO yyyy-mm-dd
  payee: string;
  description: string;
  amount: number; // positive expense amount in EUR
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
  skippedIncome: number;
}

// --- CSV parsing -----------------------------------------------------------

function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function parseGermanAmount(raw: string): number | null {
  let s = raw.replace(/["\s€]/g, "").trim();
  if (!s) return null;
  // German format "1.234,56" -> remove thousands dots, comma -> dot.
  if (/,\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // English/plain format: drop thousands commas.
    s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/.exec(s);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    let year = m[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  return null;
}

function findColumn(header: string[], patterns: RegExp[]): number {
  for (let i = 0; i < header.length; i++) {
    const cell = header[i].toLowerCase();
    if (patterns.some((p) => p.test(cell))) return i;
  }
  return -1;
}

/**
 * Parse a bank-statement CSV into expense transactions. Supports the common
 * German export shape (semicolon-delimited, comma decimals) as well as plain
 * comma CSV. Outgoing movements (negative amounts) become expenses with a
 * positive amount; incoming movements are skipped. Returns clear, line-numbered
 * errors for malformed rows instead of silently dropping data.
 */
export function parseBankCsv(text: string): ParseResult {
  const errors: string[] = [];
  const transactions: ParsedTransaction[] = [];
  let skippedIncome = 0;

  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { transactions, errors: ["Die Datei ist leer."], skippedIncome };
  }
  if (lines.length === 1) {
    return { transactions, errors: ["Die Datei enthält nur eine Kopfzeile, keine Buchungen."], skippedIncome };
  }

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const header = splitCsvLine(lines[0], delimiter);

  const dateCol = findColumn(header, [/datum/, /buchungstag/, /\bdate\b/, /valuta/]);
  const amountCol = findColumn(header, [/betrag/, /amount/, /umsatz/, /\bwert\b/]);
  const payeeCol = findColumn(header, [/empf/, /beg(ü|u)nst/, /auftraggeber/, /payee/, /zahlungs/, /\bname\b/]);
  const descCol = findColumn(header, [/verwendung/, /zweck/, /description/, /buchungstext/, /\btext\b/]);

  const missing: string[] = [];
  if (dateCol === -1) missing.push("Datum");
  if (amountCol === -1) missing.push("Betrag");
  if (payeeCol === -1 && descCol === -1) missing.push("Empfänger/Verwendungszweck");
  if (missing.length > 0) {
    errors.push(`Pflichtspalten fehlen: ${missing.join(", ")}. Erwartet werden Datum, Betrag und Empfänger oder Verwendungszweck.`);
    return { transactions, errors, skippedIncome };
  }

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter);
    const lineNo = i + 1;
    const rawAmount = cells[amountCol] ?? "";
    const amount = parseGermanAmount(rawAmount);
    if (amount === null) {
      errors.push(`Zeile ${lineNo}: Betrag „${rawAmount}“ konnte nicht gelesen werden.`);
      continue;
    }
    const date = parseDate(cells[dateCol] ?? "");
    if (date === null) {
      errors.push(`Zeile ${lineNo}: Datum „${cells[dateCol] ?? ""}“ konnte nicht gelesen werden.`);
      continue;
    }
    const payee = (payeeCol !== -1 ? cells[payeeCol] : "") ?? "";
    const description = (descCol !== -1 ? cells[descCol] : "") ?? "";
    if (amount >= 0) {
      skippedIncome++;
      continue;
    }
    transactions.push({ date, payee, description, amount: Math.abs(amount) });
  }

  if (transactions.length === 0 && errors.length === 0) {
    errors.push("Keine Ausgaben (Soll-Buchungen) in der Datei gefunden.");
  }

  return { transactions, errors, skippedIncome };
}

// --- Suggestion engine -----------------------------------------------------

const STOP_WORDS = new Set([
  "gmbh", "ag", "kg", "ohg", "ug", "co", "und", "the", "fuer", "für", "von",
  "rechnung", "invoice", "nr", "ref", "iban", "sepa", "lastschrift",
]);

/** Normalize a payee/description into a stable key for learned matching. */
export function normalizeVendorKey(payee: string, description: string): string {
  const base = (payee || description || "").toLowerCase();
  const tokens = base
    .replace(/[^a-z0-9äöüß\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t) && !/^\d+$/.test(t));
  return tokens.slice(0, 4).join(" ");
}

export function vendorLabel(payee: string, description: string): string {
  const label = (payee || description || "").trim();
  return label.length > 48 ? `${label.slice(0, 47)}…` : label || "—";
}

const HEURISTICS: { category: (typeof EXPENSE_BUDGET_CATEGORIES)[number]; patterns: RegExp[] }[] = [
  { category: "Marketing", patterns: [/marketing/, /werbung/, /agentur/, /kampagne/, /ads?\b/, /google ads/, /meta/, /social/] },
  { category: "IT & Software", patterns: [/software/, /saas/, /lizenz/, /licen[sc]e/, /cloud/, /hosting/, /aws/, /azure/, /microsoft/, /adobe/, /it-/, /server/, /domain/] },
  { category: "Personalkosten", patterns: [/gehalt/, /lohn/, /personal/, /payroll/, /sozialvers/, /recruit/, /personaldienst/] },
  { category: "Warenkosten", patterns: [/ware/, /material/, /rohstoff/, /einkauf/, /lieferant/, /wareneingang/, /handelswaren/] },
];

export function heuristicCategory(payee: string, description: string): (typeof EXPENSE_BUDGET_CATEGORIES)[number] {
  const text = `${payee} ${description}`.toLowerCase();
  for (const h of HEURISTICS) {
    if (h.patterns.some((p) => p.test(text))) return h.category;
  }
  return "Sonstige Op. Kosten";
}

export interface Suggestion {
  entity?: EntityCode;
  category: string;
  source: SuggestionSource;
  reason: string;
}

/** Find a learned mapping by exact key, then by shared-token overlap. */
export function findLearnedMapping(key: string, mappings: VendorMapping[]): VendorMapping | undefined {
  if (!key) return undefined;
  const exact = mappings.find((m) => m.key === key);
  if (exact) return exact;
  const keyTokens = new Set(key.split(" ").filter(Boolean));
  let best: VendorMapping | undefined;
  let bestScore = 0;
  for (const m of mappings) {
    const tokens = m.key.split(" ").filter(Boolean);
    const overlap = tokens.filter((t) => keyTokens.has(t)).length;
    if (overlap > 0) {
      const score = overlap * 10 + m.count;
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    }
  }
  return best;
}

/**
 * Suggest an entity + budget category for a transaction. Learned mappings win;
 * otherwise a keyword heuristic is used. (AI is queried separately by the UI
 * when no learned mapping exists and only fills gaps the heuristic left.)
 */
export function suggestForTransaction(
  tx: { payee: string; description: string },
  mappings: VendorMapping[],
  defaultEntity?: EntityCode,
): Suggestion {
  const key = normalizeVendorKey(tx.payee, tx.description);
  const learned = findLearnedMapping(key, mappings);
  if (learned) {
    return {
      entity: learned.entity,
      category: learned.category,
      source: "learned",
      reason: `Aus früherer Buchung von „${learned.label}“ gelernt.`,
    };
  }
  return {
    entity: defaultEntity,
    category: heuristicCategory(tx.payee, tx.description),
    source: "heuristic",
    reason: "Aus Stichwörtern im Verwendungszweck abgeleitet.",
  };
}

/** Upsert a learned vendor mapping after a transaction is booked. */
export function learnMapping(
  mappings: VendorMapping[],
  tx: BankTransaction,
): VendorMapping[] {
  if (!tx.entity || !tx.category) return mappings;
  const key = normalizeVendorKey(tx.payee, tx.description);
  if (!key) return mappings;
  const now = new Date().toISOString().slice(0, 10);
  const existing = mappings.find((m) => m.key === key);
  if (existing) {
    return mappings.map((m) =>
      m.key === key
        ? { ...m, entity: tx.entity!, category: tx.category!, count: m.count + 1, updatedAt: now }
        : m,
    );
  }
  return [
    { key, label: vendorLabel(tx.payee, tx.description), entity: tx.entity, category: tx.category, count: 1, updatedAt: now },
    ...mappings,
  ];
}
