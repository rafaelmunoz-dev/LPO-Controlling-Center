import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Approval,
  AppUser,
  AuditEntry,
  BalanceLineItem,
  BankTransaction,
  CompanyGroup,
  DeviceAssignment,
  Employee,
  EntityCode,
  EntityMeta,
  InventoryItem,
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
  DEFAULT_GROUP_ID,
  groupViewKey,
  groupIdFromView,
  setRegistry,
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
  assignTransaction: (id: string, patch: { entity?: EntityCode; category?: string; suggestionSource?: BankTransaction["suggestionSource"]; suggestionReason?: string }) => void;
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

// First non-archived view to fall back to when the current selection is
// archived: the first active group total, else the first active firm.
function firstActiveView(groups: CompanyGroup[], entities: EntityMeta[]): ViewKey {
  const g = groups.find((x) => !x.archived);
  if (g) return groupViewKey(g.id);
  const e = entities.find((x) => !x.archived);
  return e ? e.code : groupViewKey(DEFAULT_GROUP_ID);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  selectedEntity: groupViewKey(DEFAULT_GROUP_ID),
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
        risks: payload.risks,
        premortems: payload.premortems,
        strategyDecisions: payload.strategyDecisions,
        approvals: payload.approvals,
        uploads: payload.uploads,
        auditLog: payload.auditLog,
        selectedEntity: firstActiveView(payload.groups, payload.entities),
        currentUser: { ...s.currentUser, entityAccess: allViews },
        dataReady: true,
      };
    });
  },
  resetData: () => {
    setRegistry([], []);
    set({
      currentUser: EMPTY_USER,
      isAuthenticated: false,
      dataReady: false,
      selectedEntity: groupViewKey(DEFAULT_GROUP_ID),
      entities: [],
      groups: [],
      employees: [],
      suppliers: [],
      purchaseRequests: [],
      bankTransactions: [],
      inventory: [],
      balanceItems: [],
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
  addEntity: (meta) => set((s) => ({ entities: [...s.entities, meta] })),
  updateEntity: (code, patch) =>
    set((s) => ({ entities: s.entities.map((e) => (e.code === code ? { ...e, ...patch } : e)) })),
  archiveEntity: (code) =>
    set((s) => {
      const entities = s.entities.map((e) => (e.code === code ? { ...e, archived: true } : e));
      return {
        entities,
        selectedEntity: s.selectedEntity === code ? firstActiveView(s.groups, entities) : s.selectedEntity,
      };
    }),
  restoreEntity: (code) =>
    set((s) => ({ entities: s.entities.map((e) => (e.code === code ? { ...e, archived: false } : e)) })),
  setEntityLogo: (code, logo) =>
    set((s) => ({ entities: s.entities.map((e) => (e.code === code ? { ...e, logo: logo ?? undefined } : e)) })),

  groups: [],
  addGroup: (name) => {
    const id = `g-${Date.now()}`;
    set((s) => ({ groups: [...s.groups, { id, name }] }));
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
        selectedEntity: selInGroup ? firstActiveView(groups, entities) : s.selectedEntity,
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

// Keep the data-layer registry (used by finance/scope helpers) in sync with the
// live store so group totals and scoping always reflect current state.
setRegistry(useAppStore.getState().entities, useAppStore.getState().groups);
useAppStore.subscribe((s) => setRegistry(s.entities, s.groups));
