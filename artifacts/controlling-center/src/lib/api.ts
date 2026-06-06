import type {
  Approval,
  AuditEntry,
  BalanceLineItem,
  BankTransaction,
  CompanyGroup,
  Employee,
  EntityMeta,
  InventoryItem,
  PurchaseRequest,
  Risk,
  StrategyDecision,
  Supplier,
  UploadItem,
} from "@/data/types";

// Same-origin API. BASE_URL ends with "/" (e.g. "/"), so this yields "/api".
const API_BASE = `${import.meta.env.BASE_URL}api`;

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let code: string | undefined;
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      code = body?.error;
      if (code) message = code;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message, code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---- Identity / org membership -------------------------------------------

export type MembershipRole = "Admin" | "Mitarbeiter" | "Betrachter";

export interface MeUser {
  clerkUserId: string;
  email: string;
  name: string;
}

export interface Membership {
  id: string;
  organizationId: string;
  clerkUserId: string;
  email: string;
  name: string;
  role: MembershipRole;
  jobTitle: string;
  avatar: string;
  status: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerClerkUserId: string;
}

export interface PendingInvite {
  token: string;
  role: MembershipRole;
  organizationName: string;
  invitedByName: string | null;
}

export type MeResponse =
  | { status: "active"; user: MeUser; membership: Membership; organization: Organization | null }
  | { status: "invited"; user: MeUser; invitations: PendingInvite[] }
  | { status: "no_org"; user: MeUser };

export interface ActiveResponse {
  status: "active";
  user: MeUser;
  membership: Membership;
  organization: Organization | null;
}

export const getMe = () => http<MeResponse>("/me");
export const createOrg = (name: string, ownerName?: string) =>
  http<ActiveResponse>("/org", {
    method: "POST",
    body: JSON.stringify({ name, ownerName }),
  });
export const acceptInvite = (token: string) =>
  http<ActiveResponse>("/invitations/accept", { method: "POST", body: JSON.stringify({ token }) });

// Update the signed-in user's own profile (name, job title, avatar data URL).
export const updateProfile = (input: {
  name?: string;
  jobTitle?: string;
  avatar?: string;
}) =>
  http<Membership>("/me/profile", { method: "PATCH", body: JSON.stringify(input) });

// ---- Team management ------------------------------------------------------

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: MembershipRole;
  token: string;
  status: string;
  invitedByName: string | null;
  createdAt: string;
}

export const listMembers = () => http<Membership[]>("/members");
export const listInvitations = () => http<Invitation[]>("/invitations");
export const createInvitation = (input: {
  email: string;
  role: MembershipRole;
}) => http<Invitation>("/invitations", { method: "POST", body: JSON.stringify(input) });
export const revokeInvitation = (id: string) =>
  http<void>(`/invitations/${id}`, { method: "DELETE" });
export const updateMemberRole = (id: string, role: MembershipRole) =>
  http<Membership>(`/members/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

// ---- Org-scoped domain CRUD ----------------------------------------------

export type DomainKind =
  | "groups"
  | "entities"
  | "employees"
  | "suppliers"
  | "purchaseRequests"
  | "bankTransactions"
  | "inventory"
  | "balanceItems"
  | "risks"
  | "strategyDecisions"
  | "approvals"
  | "uploads"
  | "auditLog";

const KIND_PATH: Record<DomainKind, string> = {
  groups: "groups",
  entities: "entities",
  employees: "employees",
  suppliers: "suppliers",
  purchaseRequests: "purchase-requests",
  bankTransactions: "bank-transactions",
  inventory: "inventory",
  balanceItems: "balance-items",
  risks: "risks",
  strategyDecisions: "strategy-decisions",
  approvals: "approvals",
  uploads: "uploads",
  auditLog: "audit-log",
};

export interface DomainMap {
  groups: CompanyGroup;
  entities: EntityMeta;
  employees: Employee;
  suppliers: Supplier;
  purchaseRequests: PurchaseRequest;
  bankTransactions: BankTransaction;
  inventory: InventoryItem;
  balanceItems: BalanceLineItem;
  risks: Risk;
  strategyDecisions: StrategyDecision;
  approvals: Approval;
  uploads: UploadItem;
  auditLog: AuditEntry;
}

export const listRecords = <K extends DomainKind>(kind: K) =>
  http<DomainMap[K][]>(`/records/${KIND_PATH[kind]}`);

export const putRecord = <K extends DomainKind>(kind: K, id: string, data: DomainMap[K]) =>
  http<DomainMap[K]>(`/records/${KIND_PATH[kind]}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteRecord = (kind: DomainKind, id: string) =>
  http<void>(`/records/${KIND_PATH[kind]}/${encodeURIComponent(id)}`, { method: "DELETE" });
