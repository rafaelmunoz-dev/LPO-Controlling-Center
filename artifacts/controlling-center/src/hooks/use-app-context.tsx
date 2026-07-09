import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Approval,
  AppUser,
  AuditEntry,
  BalanceLineItem,
  BankTransaction,
  BudgetPlan,
  CompanyGroup,
  CostCenter,
  IntercompanyFlow,
  LiquidityLine,
  KpiTarget,
  DeviceAssignment,
  Employee,
  EntityCode,
  EntityMeta,
  FinanceInput,
  InventoryItem,
  Invoice,
  PreMortem,
  PurchaseRequest,
  Risk,
  StrategyDecision,
  Supplier,
  UploadItem,
  VendorMapping,
  ViewKey,
} from "@/data/types";
import { ROLE_PERMISSIONS, type NavKey } from "@/data/governance";
import {
  setFormatLocale,
  ALL_VIEW,
  isAllView,
  groupViewKey,
  groupIdFromView,
  setRegistry,
  setFinanceData,
  setBudgetData,
  setInvoiceData,
} from "@/data";
import { learnMapping, heuristicCategory } from "@/data/bank";
import type { CopilotContext } from "@/data/copilot";

type Language = "de" | "en" | "es";

export interface AppTask {
  id: string;
  title: string;
  context: string;
  createdAt: string;
  done: boolean;
}

export interface ReportDraft {
  id: string;
  title: string;
  type: string;
  entity: ViewKey;
  createdAt: string;
}

export const PERIODS = ["Mai 2026", "April 2026", "Q1 2026", "Q2 2026", "GJ 2026"] as const;
export type Period = (typeof PERIODS)[number];

// Placeholder until a real session is established from the Clerk user + the
// org membership returned by /api/me. The app shell is never rendered with this
// value (the auth gate waits for an active membership + loaded data first).
const EMPTY_USER: AppUser = {
  id: "",
  name: "",
  role: "Betrachter",
  jobTitle: "",
  organisation: "",
  email: "",
  language: "de",
  avatar: "",
  entityAccess: [],
  lastActivity: "",
  tasks: [],
};

// The DB-backed domains, loaded for the active organization after sign-in.
export interface HydratePayload {
  groups: CompanyGroup[];
  entities: EntityMeta[];
  employees: Employee[];
  suppliers: Supplier[];
  purchaseRequests: PurchaseRequest[];
  bankTransactions: BankTransaction[];
  inventory: InventoryItem[];
  balanceItems: BalanceLineItem[];
  financeInputs: FinanceInput[];
  budgetPlans: BudgetPlan[];
  invoices: Invoice[];
  costCenters: CostCenter[];
  intercompanyFlows: IntercompanyFlow[];
  liquidityLines: LiquidityLine[];
  kpiTargets: KpiTarget[];
  risks: Risk[];
  premortems: PreMortem[];
  strategyDecisions: StrategyDecision[];
  approvals: Approval[];
  uploads: UploadItem[];
  auditLog: AuditEntry[];
}

interface AppState {
  selectedEntity: ViewKey;
  setEntity: (entity: ViewKey) => void;
  period: Period;
  setPeriod: (p: Period) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;

  isAuthenticated: boolean;
  dataReady: boolean;
  // Establishes the signed-in identity from the org membership.
  setSession: (user: AppUser) => void;
  // Loads the org's DB-backed domains into the store (called once after sign-in).
  hydrate: (payload: HydratePayload) => void;
  // Clears all session + org data (called on sign-out / user switch).
  resetData: () => void;

  entities: EntityMeta[];
  addEntity: (meta: EntityMeta) => void;
  updateEntity: (code: EntityCode, patch: Partial<Omit<EntityMeta, "code">>) => void;
  archiveEntity: (code: EntityCode) => void;
  restoreEntity: (code: EntityCode) => void;
  setEntityLogo: (code: EntityCode, logo: string | null) => void;

  groups: CompanyGroup[];
  addGroup: (name: string) => string;
  renameGroup: (id: string, name: string) => void;
  setGroupLogo: (id: string, logo: string | null) => void;
  archiveGroup: (id: string) => void;
  restoreGroup: (id: string) => void;

  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  copilotContext: CopilotContext;
  setCopilotContext: (c: CopilotContext) => void;
  copilotSeed: string | null;
  askCopilot: (question: string) => void;
  clearCopilotSeed: () => void;

  allowedNav: () => NavKey[];

  uploads: UploadItem[];
  addUpload: (u: UploadItem) => void;
  updateUploadStatus: (id: string, status: UploadItem["status"]) => void;

  bankTransactions: BankTransaction[];
  importBankTransactions: (txs: BankTransaction[]) => void;
  assignTransaction: (id: string, patch: { entity?: EntityCode; category?: string; costCenter?: string; suggestionSource?: BankTransaction["suggestionSource"]; suggestionReason?: string }) => void;
  bookTransaction: (id: string) => void;
  removeBankTransaction: (id: string) => void;

  vendorMappings: VendorMapping[];

  purchaseRequests: PurchaseRequest[];
  addPurchaseRequest: (p: PurchaseRequest) => void;
  updatePRStatus: (id: string, status: PurchaseRequest["status"]) => void;
  payPurchaseRequest: (id: string) => boolean;
  categorizePurchaseRequest: (id: string, category: string) => boolean;
  transferPurchaseRequestToInventory: (id: string, payload: { name: string; category: InventoryItem["category"] }) => boolean;

  approvals: Approval[];
  updateApprovalStatus: (id: string, status: Approval["status"], approver?: string) => void;
  addApproval: (a: Approval) => void;

  deviceAssignments: DeviceAssignment[];
  addDeviceAssignment: (d: DeviceAssignment) => void;

  suppliers: Supplier[];
  addSupplier: (s: Supplier) => void;
  updateSupplier: (id: string, patch: Partial<Omit<Supplier, "id">>) => void;
  removeSupplier: (id: string) => void;

  employees: Employee[];
  addEmployee: (e: Employee) => void;
  updateEmployee: (id: string, patch: Partial<Omit<Employee, "id">>) => void;
  removeEmployee: (id: string) => void;

  inventory: InventoryItem[];
  addInventoryItem: (i: InventoryItem) => void;
  updateInventoryItem: (id: string, patch: Partial<Omit<InventoryItem, "id">>) => void;
  removeInventoryItem: (id: string) => void;

  strategyDecisions: StrategyDecision[];
  addStrategyDecision: (d: StrategyDecision) => void;
  updateStrategyDecision: (id: string, patch: Partial<Omit<StrategyDecision, "id">>) => void;
  removeStrategyDecision: (id: string) => void;

  risks: Risk[];
  addRisk: (r: Risk) => void;
  updateRisk: (id: string, patch: Partial<Omit<Risk, "id">>) => void;
  removeRisk: (id: string) => void;

  premortems: PreMortem[];
  addPreMortem: (p: PreMortem) => void;
  updatePreMortem: (id: string, patch: Partial<Omit<PreMortem, "id">>) => void;
  removePreMortem: (id: string) => void;

  balanceItems: BalanceLineItem[];
  addBalanceItem: (item: BalanceLineItem) => void;
  updateBalanceItem: (id: string, patch: Partial<Omit<BalanceLineItem, "id">>) => void;
  removeBalanceItem: (id: string) => void;

  // Real per-firm/per-period financial inputs (KPIs are derived from these).
  // Keyed by the deterministic id so a firm/period edit upserts in place.
  financeInputs: FinanceInput[];
  upsertFinanceInput: (input: FinanceInput) => void;

  // User-entered plan/budget figures per firm/period (Plan-Ist comparison reads
  // these; keyed by deterministic id so a firm/period edit upserts in place).
  budgetPlans: BudgetPlan[];
  upsertBudgetPlan: (plan: BudgetPlan) => void;

  // Open-item receivable/payable invoices per firm (Debitoren/Kreditoren).
  // Aging, DSO/DPO and working capital derive from these.
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, patch: Partial<Omit<Invoice, "id">>) => void;
  removeInvoice: (id: string) => void;

  // Cost centers (Kostenstellen): the cost dimension bank transactions and
  // purchase requests are attributed to. Master data, CRUD by the active org.
  costCenters: CostCenter[];
  addCostCenter: (cc: CostCenter) => void;
  updateCostCenter: (id: string, patch: Partial<Omit<CostCenter, "id">>) => void;
  removeCostCenter: (id: string) => void;

  // Intercompany flows (Konzern-Konsolidierung): intra-group revenue/cost
  // eliminated when a group view is consolidated. CRUD by the active org.
  intercompanyFlows: IntercompanyFlow[];
  addIntercompanyFlow: (flow: IntercompanyFlow) => void;
  updateIntercompanyFlow: (id: string, patch: Partial<Omit<IntercompanyFlow, "id">>) => void;
  removeIntercompanyFlow: (id: string) => void;

  // Rolling direct liquidity planning: weekly expected cash movements per view.
  liquidityLines: LiquidityLine[];
  addLiquidityLine: (line: LiquidityLine) => void;
  updateLiquidityLine: (id: string, patch: Partial<Omit<LiquidityLine, "id">>) => void;
  removeLiquidityLine: (id: string) => void;

  // KPI targets ("Ziele") with traffic-light status; one standing target per metric per view.
  kpiTargets: KpiTarget[];
  addKpiTarget: (target: KpiTarget) => void;
  updateKpiTarget: (id: string, patch: Partial<Omit<KpiTarget, "id">>) => void;
  removeKpiTarget: (id: string) => void;

  auditLog: AuditEntry[];
  logAction: (action: string, detail: string) => void;

  tasks: AppTask[];
  addTask: (title: string, context: string) => void;
  toggleTask: (id: string) => void;

  reportDrafts: ReportDraft[];
  addReportDraft: (title: string, type: string, entity: ViewKey) => void;
}

setFormatLocale("de");

const nowStamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");

// Fallback view when the current selection is archived: the consolidated
// view, which always exists (even for a brand-new org with no groups yet).
function firstActiveView(): ViewKey {
  return ALL_VIEW;
}

// True when the view points to a still-existing, non-archived group or firm
// (the consolidated view is always active). Used to self-heal a stale
// selection after the group/firm it pointed to is archived.
function viewIsActive(view: ViewKey, groups: CompanyGroup[], entities: EntityMeta[]): boolean {
  if (isAllView(view)) return true;
  const gid = groupIdFromView(view);
  if (gid) return groups.some((g) => g.id === gid && !g.archived);
  return entities.some((e) => e.code === view && !e.archived);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  selectedEntity: ALL_VIEW,
  setEntity: (entity) => set({ selectedEntity: entity }),
  period: "Mai 2026",
  setPeriod: (period) => set({ period }),
  language: "de",
  setLanguage: (lang) => {
    setFormatLocale(lang);
    set({ language: lang });
  },
  currentUser: EMPTY_USER,
  setCurrentUser: (user) => set({ currentUser: user }),

  isAuthenticated: false,
  dataReady: false,
  setSession: (user) => {
    setFormatLocale(user.language);
    set({ currentUser: user, isAuthenticated: true, language: user.language });
  },
  hydrate: (payload) => {
    setRegistry(payload.entities, payload.groups);
    setFinanceData(payload.financeInputs, get().period);
    setBudgetData(payload.budgetPlans);
    setInvoiceData(payload.invoices);
    set((s) => {
      const allViews: ViewKey[] = [
        ...payload.groups.filter((g) => !g.archived).map((g) => groupViewKey(g.id)),
        ...payload.entities.filter((e) => !e.archived).map((e) => e.code),
      ];
      return {
        groups: payload.groups,
        entities: payload.entities,
        employees: payload.employees,
        suppliers: payload.suppliers,
        purchaseRequests: payload.purchaseRequests,
        bankTransactions: payload.bankTransactions,
        inventory: payload.inventory,
        balanceItems: payload.balanceItems,
        financeInputs: payload.financeInputs,
        budgetPlans: payload.budgetPlans,
        invoices: payload.invoices,
        costCenters: payload.costCenters,
        intercompanyFlows: payload.intercompanyFlows,
        liquidityLines: payload.liquidityLines,
        kpiTargets: payload.kpiTargets,
        risks: payload.risks,
        premortems: payload.premortems,
        strategyDecisions: payload.strategyDecisions,
        approvals: payload.approvals,
        uploads: payload.uploads,
        auditLog: payload.auditLog,
        selectedEntity: firstActiveView(),
        currentUser: { ...s.currentUser, entityAccess: allViews },
        dataReady: true,
      };
    });
  },
  resetData: () => {
    setRegistry([], []);
    setFinanceData([], get().period);
    setBudgetData([]);
    setInvoiceData([]);
    set({
      currentUser: EMPTY_USER,
      isAuthenticated: false,
      dataReady: false,
      selectedEntity: ALL_VIEW,
      entities: [],
      groups: [],
      employees: [],
      suppliers: [],
      purchaseRequests: [],
      bankTransactions: [],
      inventory: [],
      balanceItems: [],
      financeInputs: [],
      budgetPlans: [],
      invoices: [],
      costCenters: [],
      intercompanyFlows: [],
      liquidityLines: [],
      kpiTargets: [],
      uploads: [],
      approvals: [],
      deviceAssignments: [],
      strategyDecisions: [],
      risks: [],
      premortems: [],
      vendorMappings: [],
      auditLog: [],
      tasks: [],
      reportDrafts: [],
    });
  },

  entities: [],
  addEntity: (meta) =>
    set((s) => {
      const entities = [...s.entities, meta];
      const selectedEntity = viewIsActive(s.selectedEntity, s.groups, entities)
        ? s.selectedEntity
        : meta.code;
      return { entities, selectedEntity };
    }),
  updateEntity: (code, patch) =>
    set((s) => ({ entities: s.entities.map((e) => (e.code === code ? { ...e, ...patch } : e)) })),
  archiveEntity: (code) =>
    set((s) => {
      const entities = s.entities.map((e) => (e.code === code ? { ...e, archived: true } : e));
      return {
        entities,
        selectedEntity: s.selectedEntity === code ? firstActiveView() : s.selectedEntity,
      };
    }),
  restoreEntity: (code) =>
    set((s) => ({ entities: s.entities.map((e) => (e.code === code ? { ...e, archived: false } : e)) })),
  setEntityLogo: (code, logo) =>
    set((s) => ({ entities: s.entities.map((e) => (e.code === code ? { ...e, logo: logo ?? undefined } : e)) })),

  groups: [],
  addGroup: (name) => {
    const id = `g-${Date.now()}`;
    set((s) => {
      const groups = [...s.groups, { id, name }];
      // Heal a stale/orphaned selection (e.g. leftover "group:migu" in an empty
      // org) by switching to the freshly created group.
      const selectedEntity = viewIsActive(s.selectedEntity, groups, s.entities)
        ? s.selectedEntity
        : groupViewKey(id);
      return { groups, selectedEntity };
    });
    return id;
  },
  renameGroup: (id, name) =>
    set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, name } : g)) })),
  setGroupLogo: (id, logo) =>
    set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, logo: logo ?? undefined } : g)) })),
  // Archiving a group cascades to all its firms (soft); selection falls back to
  // the first remaining active view so the app never shows an archived view.
  archiveGroup: (id) =>
    set((s) => {
      const groups = s.groups.map((g) => (g.id === id ? { ...g, archived: true } : g));
      const entities = s.entities.map((e) => (e.groupId === id ? { ...e, archived: true } : e));
      const selFirm = entities.find((e) => e.code === s.selectedEntity);
      const selInGroup = groupIdFromView(s.selectedEntity) === id || (selFirm?.groupId === id);
      return {
        groups,
        entities,
        selectedEntity: selInGroup ? firstActiveView() : s.selectedEntity,
      };
    }),
  restoreGroup: (id) =>
    set((s) => ({
      groups: s.groups.map((g) => (g.id === id ? { ...g, archived: false } : g)),
      entities: s.entities.map((e) => (e.groupId === id ? { ...e, archived: false } : e)),
    })),

  copilotOpen: false,
  setCopilotOpen: (open) => set({ copilotOpen: open }),
  copilotContext: "dashboard",
  setCopilotContext: (copilotContext) => set({ copilotContext }),
  copilotSeed: null,
  askCopilot: (question) => set({ copilotOpen: true, copilotSeed: question }),
  clearCopilotSeed: () => set({ copilotSeed: null }),

  allowedNav: () => ROLE_PERMISSIONS[get().currentUser.role] ?? [],

  uploads: [],
  addUpload: (u) => set((s) => ({ uploads: [u, ...s.uploads] })),
  updateUploadStatus: (id, status) =>
    set((s) => ({ uploads: s.uploads.map((u) => (u.id === id ? { ...u, status } : u)) })),

  bankTransactions: [],
  importBankTransactions: (txs) => set((s) => ({ bankTransactions: [...txs, ...s.bankTransactions] })),
  assignTransaction: (id, patch) =>
    set((s) => ({
      bankTransactions: s.bankTransactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
  bookTransaction: (id) =>
    set((s) => {
      const tx = s.bankTransactions.find((t) => t.id === id);
      if (!tx || !tx.entity || !tx.category) return {};
      const booked: BankTransaction = {
        ...tx,
        status: "booked",
        bookedBy: s.currentUser.name,
        bookedAt: new Date().toISOString().slice(0, 10),
      };
      return {
        bankTransactions: s.bankTransactions.map((t) => (t.id === id ? booked : t)),
        vendorMappings: learnMapping(s.vendorMappings, booked),
      };
    }),
  removeBankTransaction: (id) =>
    set((s) => ({
      bankTransactions: s.bankTransactions.filter((t) => t.id !== id),
      purchaseRequests: s.purchaseRequests.map((p) =>
        p.bankTransactionId === id ? { ...p, bankTransactionId: undefined } : p
      ),
    })),

  vendorMappings: [],

  purchaseRequests: [],
  addPurchaseRequest: (p) => set((s) => ({ purchaseRequests: [p, ...s.purchaseRequests] })),
  updatePRStatus: (id, status) =>
    set((s) => ({ purchaseRequests: s.purchaseRequests.map((p) => (p.id === id ? { ...p, status } : p)) })),
  payPurchaseRequest: (id) => {
    let ok = false;
    set((s) => {
      const pr = s.purchaseRequests.find((p) => p.id === id);
      if (!pr || pr.bankTransactionId) return {};
      const today = new Date().toISOString().slice(0, 10);
      const tx: BankTransaction = {
        id: `BTX-${Date.now()}`,
        date: today,
        payee: pr.supplier,
        description: `${pr.id} · ${pr.title}`,
        amount: pr.amount,
        entity: pr.entity,
        category: heuristicCategory(pr.supplier, pr.title),
        status: "needs-assignment",
        suggestionSource: "heuristic",
        suggestionReason: `Aus Kaufanfrage ${pr.id}`,
        importedAt: today,
      };
      ok = true;
      return {
        bankTransactions: [tx, ...s.bankTransactions],
        purchaseRequests: s.purchaseRequests.map((p) =>
          p.id === id ? { ...p, status: "Bezahlt", paidAt: today, bankTransactionId: tx.id } : p
        ),
      };
    });
    return ok;
  },
  categorizePurchaseRequest: (id, category) => {
    let ok = false;
    set((s) => {
      const pr = s.purchaseRequests.find((p) => p.id === id);
      if (!pr || !pr.bankTransactionId) return {};
      const today = new Date().toISOString().slice(0, 10);
      let bookedTx: BankTransaction | undefined;
      const bankTransactions = s.bankTransactions.map((t) => {
        if (t.id !== pr.bankTransactionId) return t;
        bookedTx = { ...t, category, status: "booked", bookedBy: s.currentUser.name, bookedAt: today };
        return bookedTx;
      });
      if (!bookedTx) return {};
      ok = true;
      return {
        bankTransactions,
        vendorMappings: learnMapping(s.vendorMappings, bookedTx),
      };
    });
    return ok;
  },
  transferPurchaseRequestToInventory: (id, payload) => {
    let ok = false;
    set((s) => {
      const pr = s.purchaseRequests.find((p) => p.id === id);
      if (!pr || pr.inventoryItemId) return {};
      const today = new Date().toISOString().slice(0, 10);
      const item: InventoryItem = {
        id: `INV-${Date.now()}`,
        inventoryNumber: `${pr.entity}-PR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: payload.name.trim() || pr.title,
        category: payload.category,
        entity: pr.entity,
        location: "—",
        assignedTo: "-",
        condition: "Neuwertig",
        purchaseDate: pr.paidAt ?? today,
        purchasePrice: pr.amount,
        currentValue: pr.amount,
        depreciation: 0,
        warrantyUntil: `${Number(today.slice(0, 4)) + 2}${today.slice(4)}`,
        status: "verfügbar",
        note: `Aus Kaufanfrage ${pr.id}`,
      };
      ok = true;
      return {
        inventory: [item, ...s.inventory],
        purchaseRequests: s.purchaseRequests.map((p) => (p.id === id ? { ...p, inventoryItemId: item.id } : p)),
      };
    });
    return ok;
  },

  approvals: [],
  updateApprovalStatus: (id, status, approver) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === id ? { ...a, status, approvedBy: status === "Freigegeben" ? approver ?? a.approvedBy : a.approvedBy } : a
      ),
    })),
  addApproval: (a) => set((s) => ({ approvals: [a, ...s.approvals] })),

  deviceAssignments: [],
  addDeviceAssignment: (d) => set((s) => ({ deviceAssignments: [d, ...s.deviceAssignments] })),

  suppliers: [],
  addSupplier: (s) => set((st) => ({ suppliers: [s, ...st.suppliers] })),
  updateSupplier: (id, patch) => set((st) => ({ suppliers: st.suppliers.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
  removeSupplier: (id) => set((st) => ({ suppliers: st.suppliers.filter((s) => s.id !== id) })),

  employees: [],
  addEmployee: (e) => set((st) => ({ employees: [e, ...st.employees] })),
  updateEmployee: (id, patch) => set((st) => ({ employees: st.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
  removeEmployee: (id) => set((st) => ({ employees: st.employees.filter((e) => e.id !== id) })),

  inventory: [],
  addInventoryItem: (i) => set((st) => ({ inventory: [i, ...st.inventory] })),
  updateInventoryItem: (id, patch) => set((st) => ({ inventory: st.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
  removeInventoryItem: (id) =>
    set((st) => ({
      inventory: st.inventory.filter((i) => i.id !== id),
      purchaseRequests: st.purchaseRequests.map((p) =>
        p.inventoryItemId === id ? { ...p, inventoryItemId: undefined } : p
      ),
    })),

  strategyDecisions: [],
  addStrategyDecision: (d) => set((st) => ({ strategyDecisions: [d, ...st.strategyDecisions] })),
  updateStrategyDecision: (id, patch) => set((st) => ({ strategyDecisions: st.strategyDecisions.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  removeStrategyDecision: (id) => set((st) => ({ strategyDecisions: st.strategyDecisions.filter((d) => d.id !== id) })),

  risks: [],
  addRisk: (r) => set((s) => ({ risks: [r, ...s.risks] })),
  updateRisk: (id, patch) => set((s) => ({ risks: s.risks.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  removeRisk: (id) => set((s) => ({ risks: s.risks.filter((r) => r.id !== id) })),

  premortems: [],
  addPreMortem: (p) => set((s) => ({ premortems: [p, ...s.premortems] })),
  updatePreMortem: (id, patch) => set((s) => ({ premortems: s.premortems.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  removePreMortem: (id) => set((s) => ({ premortems: s.premortems.filter((p) => p.id !== id) })),

  balanceItems: [],
  addBalanceItem: (item) => set((s) => ({ balanceItems: [...s.balanceItems, item] })),
  updateBalanceItem: (id, patch) =>
    set((s) => ({ balanceItems: s.balanceItems.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
  removeBalanceItem: (id) => set((s) => ({ balanceItems: s.balanceItems.filter((b) => b.id !== id) })),

  financeInputs: [],
  upsertFinanceInput: (input) =>
    set((s) => {
      const exists = s.financeInputs.some((f) => f.id === input.id);
      return {
        financeInputs: exists
          ? s.financeInputs.map((f) => (f.id === input.id ? input : f))
          : [...s.financeInputs, input],
      };
    }),

  budgetPlans: [],
  upsertBudgetPlan: (plan) =>
    set((s) => {
      const exists = s.budgetPlans.some((p) => p.id === plan.id);
      return {
        budgetPlans: exists
          ? s.budgetPlans.map((p) => (p.id === plan.id ? plan : p))
          : [...s.budgetPlans, plan],
      };
    }),

  invoices: [],
  addInvoice: (invoice) => set((s) => ({ invoices: [...s.invoices, invoice] })),
  updateInvoice: (id, patch) =>
    set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
  removeInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) })),

  costCenters: [],
  addCostCenter: (cc) => set((s) => ({ costCenters: [...s.costCenters, cc] })),
  updateCostCenter: (id, patch) =>
    set((s) => ({ costCenters: s.costCenters.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  removeCostCenter: (id) => set((s) => ({ costCenters: s.costCenters.filter((c) => c.id !== id) })),

  intercompanyFlows: [],
  addIntercompanyFlow: (flow) => set((s) => ({ intercompanyFlows: [...s.intercompanyFlows, flow] })),
  updateIntercompanyFlow: (id, patch) =>
    set((s) => ({ intercompanyFlows: s.intercompanyFlows.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
  removeIntercompanyFlow: (id) =>
    set((s) => ({ intercompanyFlows: s.intercompanyFlows.filter((f) => f.id !== id) })),

  liquidityLines: [],
  addLiquidityLine: (line) => set((s) => ({ liquidityLines: [...s.liquidityLines, line] })),
  updateLiquidityLine: (id, patch) =>
    set((s) => ({ liquidityLines: s.liquidityLines.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
  removeLiquidityLine: (id) =>
    set((s) => ({ liquidityLines: s.liquidityLines.filter((l) => l.id !== id) })),

  kpiTargets: [],
  addKpiTarget: (target) => set((s) => ({ kpiTargets: [...s.kpiTargets, target] })),
  updateKpiTarget: (id, patch) =>
    set((s) => ({ kpiTargets: s.kpiTargets.map((k) => (k.id === id ? { ...k, ...patch } : k)) })),
  removeKpiTarget: (id) =>
    set((s) => ({ kpiTargets: s.kpiTargets.filter((k) => k.id !== id) })),

  auditLog: [],
  logAction: (action, detail) =>
    set((s) => ({
      auditLog: [
        { id: `AL-${Date.now()}`, timestamp: nowStamp(), user: s.currentUser.name, role: s.currentUser.role, action, detail },
        ...s.auditLog,
      ].slice(0, 500),
    })),

  tasks: [],
  addTask: (title, context) =>
    set((s) => ({
      tasks: [{ id: `T-${Date.now()}`, title, context, createdAt: new Date().toISOString().slice(0, 10), done: false }, ...s.tasks],
    })),
  toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),

  reportDrafts: [],
  addReportDraft: (title, type, entity) =>
    set((s) => ({
      reportDrafts: [{ id: `RD-${Date.now()}`, title, type, entity, createdAt: new Date().toISOString().slice(0, 10) }, ...s.reportDrafts],
    })),
    }),
    {
      // Only the user's UI language preference is persisted locally. All business
      // data is org-scoped in the database and loaded per session — never cached
      // in localStorage, so there is no cross-tenant/cross-user bleed.
      name: "lpo-cc-prefs-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ language: s.language }),
      onRehydrateStorage: () => (state) => {
        if (state) setFormatLocale(state.language);
      },
    }
  )
);

// Keep the data-layer registries (used by finance/scope helpers) in sync with
// the live store so group totals, scoping and derived KPIs always reflect the
// current state, active period and entered financial inputs.
setRegistry(useAppStore.getState().entities, useAppStore.getState().groups);
setFinanceData(useAppStore.getState().financeInputs, useAppStore.getState().period);
setBudgetData(useAppStore.getState().budgetPlans);
setInvoiceData(useAppStore.getState().invoices);
useAppStore.subscribe((s) => {
  setRegistry(s.entities, s.groups);
  setFinanceData(s.financeInputs, s.period);
  setBudgetData(s.budgetPlans);
  setInvoiceData(s.invoices);
});
