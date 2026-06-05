import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Approval,
  AppUser,
  AuditEntry,
  DeviceAssignment,
  Employee,
  EntityCode,
  EntityMeta,
  InventoryItem,
  PurchaseRequest,
  Risk,
  StrategyDecision,
  Supplier,
  UploadItem,
  ViewKey,
} from "@/data/types";
import { ROLE_PERMISSIONS, type NavKey } from "@/data/governance";
import { RISKS, STRATEGY_DECISIONS } from "@/data/governance";
import { APPROVALS, DEVICE_ASSIGNMENTS, EMPLOYEES, INVENTORY, PURCHASE_REQUESTS, SUPPLIERS, UPLOADS } from "@/data/operations";
import { setFormatLocale, ENTITIES } from "@/data";
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

export const USERS: AppUser[] = [
  {
    id: "1",
    name: "Maria Keller",
    role: "Controller",
    organisation: "LPO Group",
    email: "m.keller@lpo-group.com",
    language: "de",
    avatar: "/avatars/maria.png",
    entityAccess: ["MiGu Group Gesamt", "IMP", "C&A", "MKT", "CPE", "COSM"],
    lastActivity: "2026-05-30 09:12",
    tasks: ["Freigabe Baukran Q3 prüfen", "Monatsabschluss Mai abschließen"],
  },
  {
    id: "2",
    name: "Thomas Berger",
    role: "Geschäftsführer",
    organisation: "LPO Group",
    email: "t.berger@lpo-group.com",
    language: "de",
    avatar: "/avatars/thomas.png",
    entityAccess: ["MiGu Group Gesamt", "IMP", "C&A", "MKT", "CPE", "COSM"],
    lastActivity: "2026-05-30 09:40",
    tasks: ["Strategie Österreich freigeben", "Quartalsbericht sichten"],
  },
  {
    id: "3",
    name: "Daniel Weber",
    role: "Finanzbuchhalter",
    organisation: "LPO Group",
    email: "d.weber@lpo-group.com",
    language: "de",
    avatar: "/avatars/daniel.png",
    entityAccess: ["MiGu Group Gesamt", "IMP", "C&A"],
    lastActivity: "2026-05-30 08:47",
    tasks: ["Bankauszug Mai hochladen", "Inventar IMP ausbuchen"],
  },
  {
    id: "4",
    name: "Sofia Martín",
    role: "Mitarbeiter",
    organisation: "LPO Group",
    email: "s.martin@lpo-group.com",
    language: "es",
    avatar: "/avatars/sofia.png",
    entityAccess: ["MiGu Group Gesamt", "COSM", "CPE", "MKT"],
    lastActivity: "2026-05-29 17:33",
    tasks: ["Kaufanfrage PR-2048 einreichen"],
  },
];

const INITIAL_TASKS: AppTask[] = [
  { id: "T-1001", title: "Freigabe Baukran Q3 prüfen", context: "Freigaben", createdAt: "2026-05-28", done: false },
  { id: "T-1002", title: "Monatsabschluss Mai abschließen", context: "Finanzen", createdAt: "2026-05-29", done: false },
];

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
  login: (user: AppUser) => void;
  logout: () => void;

  entities: EntityMeta[];
  addEntity: (meta: EntityMeta) => void;
  updateEntity: (code: EntityCode, patch: Partial<Omit<EntityMeta, "code">>) => void;
  removeEntity: (code: EntityCode) => void;
  setEntityLogo: (code: EntityCode, logo: string | null) => void;

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

  purchaseRequests: PurchaseRequest[];
  addPurchaseRequest: (p: PurchaseRequest) => void;
  updatePRStatus: (id: string, status: PurchaseRequest["status"]) => void;

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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  selectedEntity: "MiGu Group Gesamt",
  setEntity: (entity) => set({ selectedEntity: entity }),
  period: "Mai 2026",
  setPeriod: (period) => set({ period }),
  language: "de",
  setLanguage: (lang) => {
    setFormatLocale(lang);
    set({ language: lang });
  },
  currentUser: USERS[0],
  setCurrentUser: (user) => set({ currentUser: user }),

  isAuthenticated: false,
  login: (user) => {
    setFormatLocale(user.language);
    set((s) => ({
      currentUser: user,
      isAuthenticated: true,
      language: user.language,
      auditLog: [
        { id: `AL-${Date.now()}`, timestamp: nowStamp(), user: user.name, role: user.role, action: "auth:login", detail: `${user.name} angemeldet (${user.role})` },
        ...s.auditLog,
      ],
    }));
  },
  logout: () => {
    const u = get().currentUser;
    set((s) => ({
      isAuthenticated: false,
      auditLog: [
        { id: `AL-${Date.now()}`, timestamp: nowStamp(), user: u.name, role: u.role, action: "auth:logout", detail: `${u.name} abgemeldet` },
        ...s.auditLog,
      ],
    }));
  },

  entities: ENTITIES.map((e) => ({ ...e })),
  addEntity: (meta) => set((s) => ({ entities: [...s.entities, meta] })),
  updateEntity: (code, patch) =>
    set((s) => ({ entities: s.entities.map((e) => (e.code === code ? { ...e, ...patch } : e)) })),
  removeEntity: (code) =>
    set((s) => ({
      entities: s.entities.filter((e) => e.code !== code),
      selectedEntity: s.selectedEntity === code ? "MiGu Group Gesamt" : s.selectedEntity,
    })),
  setEntityLogo: (code, logo) =>
    set((s) => ({ entities: s.entities.map((e) => (e.code === code ? { ...e, logo: logo ?? undefined } : e)) })),

  copilotOpen: false,
  setCopilotOpen: (open) => set({ copilotOpen: open }),
  copilotContext: "dashboard",
  setCopilotContext: (copilotContext) => set({ copilotContext }),
  copilotSeed: null,
  askCopilot: (question) => set({ copilotOpen: true, copilotSeed: question }),
  clearCopilotSeed: () => set({ copilotSeed: null }),

  allowedNav: () => ROLE_PERMISSIONS[get().currentUser.role],

  uploads: UPLOADS,
  addUpload: (u) => set((s) => ({ uploads: [u, ...s.uploads] })),
  updateUploadStatus: (id, status) =>
    set((s) => ({ uploads: s.uploads.map((u) => (u.id === id ? { ...u, status } : u)) })),

  purchaseRequests: PURCHASE_REQUESTS,
  addPurchaseRequest: (p) => set((s) => ({ purchaseRequests: [p, ...s.purchaseRequests] })),
  updatePRStatus: (id, status) =>
    set((s) => ({ purchaseRequests: s.purchaseRequests.map((p) => (p.id === id ? { ...p, status } : p)) })),

  approvals: APPROVALS,
  updateApprovalStatus: (id, status, approver) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === id ? { ...a, status, approvedBy: status === "Freigegeben" ? approver ?? a.approvedBy : a.approvedBy } : a
      ),
    })),
  addApproval: (a) => set((s) => ({ approvals: [a, ...s.approvals] })),

  deviceAssignments: DEVICE_ASSIGNMENTS,
  addDeviceAssignment: (d) => set((s) => ({ deviceAssignments: [d, ...s.deviceAssignments] })),

  suppliers: SUPPLIERS.map((s) => ({ ...s })),
  addSupplier: (s) => set((st) => ({ suppliers: [s, ...st.suppliers] })),
  updateSupplier: (id, patch) => set((st) => ({ suppliers: st.suppliers.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
  removeSupplier: (id) => set((st) => ({ suppliers: st.suppliers.filter((s) => s.id !== id) })),

  employees: EMPLOYEES.map((e) => ({ ...e })),
  addEmployee: (e) => set((st) => ({ employees: [e, ...st.employees] })),
  updateEmployee: (id, patch) => set((st) => ({ employees: st.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
  removeEmployee: (id) => set((st) => ({ employees: st.employees.filter((e) => e.id !== id) })),

  inventory: INVENTORY.map((i) => ({ ...i })),
  addInventoryItem: (i) => set((st) => ({ inventory: [i, ...st.inventory] })),
  updateInventoryItem: (id, patch) => set((st) => ({ inventory: st.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
  removeInventoryItem: (id) => set((st) => ({ inventory: st.inventory.filter((i) => i.id !== id) })),

  strategyDecisions: STRATEGY_DECISIONS.map((d) => ({ ...d })),
  addStrategyDecision: (d) => set((st) => ({ strategyDecisions: [d, ...st.strategyDecisions] })),
  updateStrategyDecision: (id, patch) => set((st) => ({ strategyDecisions: st.strategyDecisions.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  removeStrategyDecision: (id) => set((st) => ({ strategyDecisions: st.strategyDecisions.filter((d) => d.id !== id) })),

  risks: RISKS.map((r) => ({ ...r })),
  addRisk: (r) => set((s) => ({ risks: [r, ...s.risks] })),
  updateRisk: (id, patch) => set((s) => ({ risks: s.risks.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  removeRisk: (id) => set((s) => ({ risks: s.risks.filter((r) => r.id !== id) })),

  auditLog: [],
  logAction: (action, detail) =>
    set((s) => ({
      auditLog: [
        { id: `AL-${Date.now()}`, timestamp: nowStamp(), user: s.currentUser.name, role: s.currentUser.role, action, detail },
        ...s.auditLog,
      ].slice(0, 500),
    })),

  tasks: INITIAL_TASKS,
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
      name: "lpo-cc-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => {
        const state = persisted as Partial<AppState> | undefined;
        if (state && version < 2 && state.currentUser) {
          const legacyRoleMap: Record<string, AppUser["role"]> = {
            Admin: "Controller",
            Controller: "Controller",
            "Management Viewer": "Geschäftsführer",
            "Finance Analyst": "Finanzbuchhalter",
            "Procurement Manager": "Finanzbuchhalter",
            "Inventory Manager": "Finanzbuchhalter",
            "Entity Manager": "Mitarbeiter",
          };
          const mapped = legacyRoleMap[state.currentUser.role as string] ?? "Mitarbeiter";
          state.currentUser = { ...state.currentUser, role: mapped };
        }
        return state as AppState;
      },
      partialize: (s) => ({
        selectedEntity: s.selectedEntity,
        period: s.period,
        language: s.language,
        currentUser: s.currentUser,
        isAuthenticated: s.isAuthenticated,
        entities: s.entities,
        uploads: s.uploads,
        purchaseRequests: s.purchaseRequests,
        approvals: s.approvals,
        deviceAssignments: s.deviceAssignments,
        suppliers: s.suppliers,
        employees: s.employees,
        inventory: s.inventory,
        strategyDecisions: s.strategyDecisions,
        risks: s.risks,
        auditLog: s.auditLog,
        tasks: s.tasks,
        reportDrafts: s.reportDrafts,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) setFormatLocale(state.language);
      },
    }
  )
);
