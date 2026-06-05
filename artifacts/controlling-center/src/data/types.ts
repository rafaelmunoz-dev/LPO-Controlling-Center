export type EntityCode = "IMP" | "C&A" | "MKT" | "CPE" | "COSM" | (string & {});
export type ViewKey = "MiGu Group Gesamt" | EntityCode;

export type RiskLevel = "Niedrig" | "Mittel" | "Hoch";
export type Trend = "up" | "down" | "flat";

export interface EntityMeta {
  code: EntityCode;
  name: string;
  description: string;
  location: string;
  employees: number;
  color: string;
  logo?: string;
}

export interface MonthPoint {
  month: string;
  revenue: number;
  costs: number;
  ebitda: number;
  profit: number;
}

export interface EntityFinance {
  view: ViewKey;
  revenue: number;
  ebitda: number;
  ebitdaMargin: number;
  netProfit: number;
  cash: number;
  cashRunway: number;
  openInvoices: number;
  openInvoicesCount: number;
  riskLevel: RiskLevel;
  series: MonthPoint[];
  revenueChange: number;
  ebitdaChange: number;
  marginChange: number;
  netChange: number;
  cashChange: number;
}

export interface BudgetRow {
  category: string;
  budget: number;
  actual: number;
}

export interface CashflowBlock {
  operating: number;
  investing: number;
  financing: number;
  netChange: number;
  series: { month: string; operating: number; investing: number; financing: number }[];
}

export interface LiquidityPoint {
  week: string;
  best: number;
  realistic: number;
  worst: number;
}

export interface PLRow {
  label: string;
  value: number;
  explain?: string;
  bold?: boolean;
}

export interface BalanceRow {
  label: string;
  value: number;
  explain?: string;
  bold?: boolean;
}

export interface IntercompanyRow {
  from: EntityCode;
  to: EntityCode;
  description: string;
  amount: number;
}

export type ForecastKind =
  | "Umsatz"
  | "Kosten"
  | "Liquidität"
  | "Personalbedarf"
  | "Einkauf"
  | "Inventarbedarf"
  | "Investitionen";

export interface ForecastSeries {
  kind: ForecastKind;
  unit: string;
  points: { period: string; best: number; realistic: number; worst: number }[];
}

export type Role =
  | "Controller"
  | "Geschäftsführer"
  | "Finanzbuchhalter"
  | "Mitarbeiter";

export interface AppUser {
  id: string;
  name: string;
  role: Role;
  organisation: string;
  email: string;
  language: "de" | "en" | "es";
  avatar: string;
  entityAccess: ViewKey[];
  lastActivity: string;
  tasks: string[];
}

export type UploadStatus = "Neu" | "In Prüfung" | "Verarbeitet" | "Fehler" | "Archiviert";
export type DocType =
  | "Monatsbericht"
  | "Einkaufsliste"
  | "Inventurliste"
  | "Rechnungsliste"
  | "Bankübersicht"
  | "Budgetdatei"
  | "Lieferantenliste"
  | "Mitarbeiterliste";

export interface UploadItem {
  id: string;
  fileName: string;
  docType: DocType;
  entity: EntityCode;
  period: string;
  format: "Excel" | "CSV" | "PDF" | "Word" | "Bild";
  status: UploadStatus;
  uploadedBy: string;
  uploadedAt: string;
  sizeKb: number;
  note?: string;
}

export type PRStatus =
  | "Entwurf"
  | "Eingereicht"
  | "In Prüfung"
  | "Freigegeben"
  | "Abgelehnt"
  | "Bestellt"
  | "Erhalten"
  | "Bezahlt";

export interface Supplier {
  id: string;
  name: string;
  category: string;
  rating: number;
  country: string;
}

export interface PurchaseRequest {
  id: string;
  title: string;
  supplier: string;
  amount: number;
  entity: EntityCode;
  category: string;
  justification: string;
  status: PRStatus;
  requestedBy: string;
  createdAt: string;
  document?: string;
  source?: "Manuell" | "Microsoft Forms";
}

export type ApprovalType =
  | "Kaufanfrage"
  | "Rechnung"
  | "Budgetüberschreitung"
  | "Neuer Lieferant"
  | "Inventar-Ausmusterung"
  | "Investition"
  | "Strategieentscheidung";
export type ApprovalStatus = "Offen" | "In Prüfung" | "Freigegeben" | "Abgelehnt";

export interface Approval {
  id: string;
  type: ApprovalType;
  subject: string;
  entity: EntityCode;
  amount?: number;
  requestedBy: string;
  reviewedBy: string;
  approvedBy?: string;
  date: string;
  reason: string;
  documents: string[];
  risks: string;
  status: ApprovalStatus;
}

export type InventoryCategory =
  | "Laptop"
  | "Monitor"
  | "Handy"
  | "Tablet"
  | "Möbel"
  | "Maschine"
  | "Fahrzeug"
  | "Software-Lizenz"
  | "Sonstiges";
export type InventoryStatus =
  | "verfügbar"
  | "zugewiesen"
  | "in Reparatur"
  | "verloren"
  | "ausgemustert"
  | "verkauft";

export interface InventoryItem {
  id: string;
  inventoryNumber: string;
  name: string;
  category: InventoryCategory;
  entity: EntityCode;
  location: string;
  assignedTo: string;
  condition: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  depreciation: number;
  warrantyUntil: string;
  status: InventoryStatus;
  note?: string;
}

export type EmployeeStatus = "Aktiv" | "Beurlaubt" | "Ausgeschieden";

export interface Employee {
  id: string;
  name: string;
  avatar: string;
  email: string;
  entity: EntityCode;
  department: string;
  position: string;
  startDate: string;
  status: EmployeeStatus;
  location: string;
  assignedDevices: string[];
  openReturns: number;
  note?: string;
}

export interface DeviceAssignment {
  id: string;
  employee: string;
  device: string;
  inventoryNumber: string;
  issueDate: string;
  returnDate?: string;
  conditionIssue: string;
  conditionReturn?: string;
  protocol?: string;
  confirmed: boolean;
}

export interface Risk {
  id: string;
  title: string;
  entity: EntityCode;
  impact: RiskLevel;
  probability: RiskLevel;
  owner: string;
  status: "Offen" | "In Beobachtung" | "Geschlossen";
  trend: Trend;
}

export interface PreMortem {
  id: string;
  project: string;
  entity: EntityCode;
  goal: string;
  expectedBenefit: string;
  assumptions: string;
  whatCouldGoWrong: string;
  mostLikelyRisk: string;
  mostDangerousRisk: string;
  earlyWarnings: string;
  countermeasures: string;
  owner: string;
  reviewDate: string;
}

export interface StrategyDecision {
  id: string;
  title: string;
  entity: EntityCode;
  goal: string;
  expectedEffect: string;
  budget: number;
  risk: RiskLevel;
  owner: string;
  startDate: string;
  reviewDate: string;
  expectedKpi: string;
  actualKpi: string;
  evaluation: "Offen" | "Übertroffen" | "Erfüllt" | "Verfehlt";
  learnings: string;
}

export interface FormResponse {
  id: string;
  form: string;
  respondent: string;
  submittedAt: string;
  entity: EntityCode;
  fields: { label: string; value: string }[];
  converted: boolean;
}

export interface MsAdapter {
  service: string;
  description: string;
  status: "Mock-Daten" | "Bereit" | "Nicht verbunden";
  lastSync: string;
}

export interface ReportDef {
  id: string;
  title: string;
  description: string;
  period: string;
  type: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  action: string;
  detail: string;
}
