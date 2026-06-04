import { create } from "zustand";
import type {
  Approval,
  AppUser,
  DeviceAssignment,
  PurchaseRequest,
  Risk,
  UploadItem,
  ViewKey,
} from "@/data/types";
import { ROLE_PERMISSIONS, type NavKey } from "@/data/governance";
import { RISKS } from "@/data/governance";
import { APPROVALS, DEVICE_ASSIGNMENTS, PURCHASE_REQUESTS, UPLOADS } from "@/data/operations";
import { setFormatLocale } from "@/data";
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
    name: "Daniel Weber",
    role: "Finance Analyst",
    organisation: "LPO Group",
    email: "d.weber@lpo-group.com",
    language: "de",
    avatar: "/avatars/daniel.png",
    entityAccess: ["MiGu Group Gesamt", "IMP", "C&A"],
    lastActivity: "2026-05-30 08:47",
    tasks: ["Forecast Q3 aktualisieren", "Wechselkursrisiko bewerten"],
  },
  {
    id: "3",
    name: "Sofia Martín",
    role: "Procurement Manager",
    organisation: "LPO Group",
    email: "s.martin@lpo-group.com",
    language: "es",
    avatar: "/avatars/sofia.png",
    entityAccess: ["MiGu Group Gesamt", "COSM", "CPE", "MKT"],
    lastActivity: "2026-05-29 17:33",
    tasks: ["Lieferantenfreigabe CleanChem", "Kaufanfrage PR-2048 einreichen"],
  },
  {
    id: "4",
    name: "Lucas Braun",
    role: "Inventory Manager",
    organisation: "LPO Group",
    email: "l.braun@lpo-group.com",
    language: "de",
    avatar: "/avatars/lucas.png",
    entityAccess: ["MiGu Group Gesamt", "C&A", "IMP"],
    lastActivity: "2026-05-30 07:58",
    tasks: ["Rückgabe ThinkPad dokumentieren", "Ausmusterung 12 Monitore"],
  },
  {
    id: "5",
    name: "Clara Hoffmann",
    role: "Management Viewer",
    organisation: "MiGu Group",
    email: "c.hoffmann@migu-group.com",
    language: "en",
    avatar: "/avatars/clara.png",
    entityAccess: ["MiGu Group Gesamt", "COSM"],
    lastActivity: "2026-05-29 14:05",
    tasks: ["Strategie Österreich freigeben", "Quartalsbericht sichten"],
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

  risks: Risk[];
  addRisk: (r: Risk) => void;

  tasks: AppTask[];
  addTask: (title: string, context: string) => void;
  toggleTask: (id: string) => void;

  reportDrafts: ReportDraft[];
  addReportDraft: (title: string, type: string, entity: ViewKey) => void;
}

setFormatLocale("de");

export const useAppStore = create<AppState>((set, get) => ({
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

  risks: RISKS,
  addRisk: (r) => set((s) => ({ risks: [r, ...s.risks] })),

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
}));
