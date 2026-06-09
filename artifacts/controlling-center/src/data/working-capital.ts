import type { EntityCode, Invoice, InvoiceKind, ViewKey } from "./types";
import { entityCodesForView } from "./groups";
import { getCogs, getFinance, getInventoryValue } from "./finance";

// ---------------------------------------------------------------------------
// Open-item accounting (Debitoren / Kreditoren). Receivable and payable
// invoices are entered and maintained by the user per firm (Invoice records,
// persisted org-scoped in the DB). Aging buckets, DSO/DPO and working capital
// are all DERIVED from these — there are no synthetic figures. Group views are
// never stored: they aggregate their member firms' invoices.
// ---------------------------------------------------------------------------
let invoices: Invoice[] = [];

export function setInvoiceData(list: Invoice[]): void {
  invoices = list;
}

export function invoiceRegistry(): Invoice[] {
  return invoices;
}

// Invoices are a collection (many per firm), so ids are unique per record
// rather than deterministic per firm/period.
export function newInvoiceId(kind: InvoiceKind): string {
  const tag = kind === "receivable" ? "AR" : "AP";
  return `INV-${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyInvoice(kind: InvoiceKind, entity: EntityCode): Invoice {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: newInvoiceId(kind),
    entity,
    kind,
    counterparty: "",
    invoiceNumber: "",
    issueDate: today,
    dueDate: today,
    amount: 0,
    paidAmount: 0,
  };
}

// Still-outstanding amount of an invoice (never negative).
export function invoiceOpenAmount(inv: Invoice): number {
  return Math.max(0, inv.amount - (inv.paidAmount || 0));
}

export type InvoiceStatus = "offen" | "teilbezahlt" | "bezahlt" | "ueberfaellig";

// Settlement state, derived from the entered amounts and the due date. The
// overdue test uses the same day-granularity basis as agingBucketOf so a row's
// status badge never contradicts its aging bucket / overdue totals.
export function invoiceStatus(inv: Invoice, asOf: Date = new Date()): InvoiceStatus {
  const open = invoiceOpenAmount(inv);
  if (open <= 0) return "bezahlt";
  if (agingBucketOf(inv.dueDate, asOf) !== "notDue") return "ueberfaellig";
  return (inv.paidAmount || 0) > 0 ? "teilbezahlt" : "offen";
}

// ---------------------------------------------------------------------------
// Aging
// ---------------------------------------------------------------------------
export const AGING_BUCKETS = ["notDue", "d1_30", "d31_60", "d61_90", "d90plus"] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];

function daysBetween(later: Date, earlier: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / 86_400_000);
}

// Which aging bucket an open invoice falls into, by days past its due date.
export function agingBucketOf(dueDate: string, asOf: Date = new Date()): AgingBucket {
  const days = daysBetween(asOf, new Date(dueDate));
  if (days <= 0) return "notDue";
  if (days <= 30) return "d1_30";
  if (days <= 60) return "d31_60";
  if (days <= 90) return "d61_90";
  return "d90plus";
}

export interface AgingBucketRow {
  bucket: AgingBucket;
  amount: number;
  count: number;
}

export interface AgingReport {
  kind: InvoiceKind;
  total: number; // sum of all open amounts
  overdue: number; // open amounts past due (everything but notDue)
  buckets: AgingBucketRow[];
}

// Every invoice in scope for a view (group expands to its non-archived firms).
export function scopedInvoices(view: ViewKey, kind: InvoiceKind): Invoice[] {
  const codes = new Set(entityCodesForView(view));
  return invoices.filter((i) => i.kind === kind && codes.has(i.entity));
}

// Open (unsettled) invoices in scope for a view.
export function scopedOpenInvoices(view: ViewKey, kind: InvoiceKind): Invoice[] {
  return scopedInvoices(view, kind).filter((i) => invoiceOpenAmount(i) > 0);
}

export function getAging(view: ViewKey, kind: InvoiceKind, asOf: Date = new Date()): AgingReport {
  const buckets: AgingBucketRow[] = AGING_BUCKETS.map((b) => ({ bucket: b, amount: 0, count: 0 }));
  let total = 0;
  let overdue = 0;
  for (const inv of scopedOpenInvoices(view, kind)) {
    const amt = invoiceOpenAmount(inv);
    const bucket = agingBucketOf(inv.dueDate, asOf);
    const row = buckets.find((r) => r.bucket === bucket)!;
    row.amount += amt;
    row.count += 1;
    total += amt;
    if (bucket !== "notDue") overdue += amt;
  }
  return { kind, total, overdue, buckets };
}

// ---------------------------------------------------------------------------
// DSO / DPO / Working Capital
// ---------------------------------------------------------------------------

// Calendar days a reporting period covers, used to annualise DSO/DPO against the
// period's revenue/COGS (month ≈ 30, quarter ≈ 91, financial year = 365).
function periodDays(period: string): number {
  if (period.startsWith("Q")) return 91;
  if (period.startsWith("GJ") || period.startsWith("Geschäftsjahr")) return 365;
  return 30;
}

export interface WorkingCapital {
  openReceivables: number;
  openPayables: number;
  inventory: number;
  workingCapital: number; // receivables + inventory − payables
  dso: number; // days sales outstanding
  dpo: number; // days payable outstanding
  ccc: number; // cash gap on trade items (dso − dpo), in days
  revenue: number;
  cogs: number;
  overdueReceivables: number;
  overduePayables: number;
}

export function getWorkingCapital(view: ViewKey, period: string): WorkingCapital {
  const ar = getAging(view, "receivable");
  const ap = getAging(view, "payable");
  const revenue = getFinance(view, period).revenue;
  const cogs = getCogs(view, period);
  const inventory = getInventoryValue(view);
  const days = periodDays(period);

  const dso = revenue > 0 ? Math.round((ar.total / revenue) * days) : 0;
  const dpo = cogs > 0 ? Math.round((ap.total / cogs) * days) : 0;

  return {
    openReceivables: ar.total,
    openPayables: ap.total,
    inventory,
    workingCapital: ar.total + inventory - ap.total,
    dso,
    dpo,
    ccc: dso - dpo,
    revenue,
    cogs,
    overdueReceivables: ar.overdue,
    overduePayables: ap.overdue,
  };
}
