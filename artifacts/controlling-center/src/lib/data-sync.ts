import { useAppStore } from "@/hooks/use-app-context";
import * as api from "./api";

// The DB-backed domains and the store array each one maps to. The store key is
// identical to the DomainKind for all eight domains.
const KINDS: api.DomainKind[] = [
  "groups",
  "entities",
  "employees",
  "suppliers",
  "purchaseRequests",
  "bankTransactions",
  "inventory",
  "balanceItems",
  "financeInputs",
  "budgetPlans",
  "invoices",
  "costCenters",
  "intercompanyFlows",
  "liquidityLines",
  "kpiTargets",
  "risks",
  "premortems",
  "strategyDecisions",
  "approvals",
  "uploads",
  "auditLog",
];

// Primary-key field per domain (entities are keyed by their stable firm code).
const ID_FIELD: Record<api.DomainKind, string> = {
  groups: "id",
  entities: "code",
  employees: "id",
  suppliers: "id",
  purchaseRequests: "id",
  bankTransactions: "id",
  inventory: "id",
  balanceItems: "id",
  financeInputs: "id",
  budgetPlans: "id",
  invoices: "id",
  costCenters: "id",
  intercompanyFlows: "id",
  liquidityLines: "id",
  kpiTargets: "id",
  risks: "id",
  premortems: "id",
  strategyDecisions: "id",
  approvals: "id",
  uploads: "id",
  auditLog: "id",
};

type Snapshot = Record<string, string>; // recordId -> JSON.stringify(record)
const snapshots: Record<api.DomainKind, Snapshot> = {
  groups: {},
  entities: {},
  employees: {},
  suppliers: {},
  purchaseRequests: {},
  bankTransactions: {},
  inventory: {},
  balanceItems: {},
  financeInputs: {},
  budgetPlans: {},
  invoices: {},
  costCenters: {},
  intercompanyFlows: {},
  liquidityLines: {},
  kpiTargets: {},
  risks: {},
  premortems: {},
  strategyDecisions: {},
  approvals: {},
  uploads: {},
  auditLog: {},
};

let enabled = false;
let running = false;
let dirty = false;
let unsubscribe: (() => void) | null = null;

function rows(kind: api.DomainKind): Record<string, unknown>[] {
  return useAppStore.getState()[kind] as unknown as Record<string, unknown>[];
}

function snapshotOf(kind: api.DomainKind, list: Record<string, unknown>[]): Snapshot {
  const idf = ID_FIELD[kind];
  const snap: Snapshot = {};
  for (const r of list) snap[String(r[idf])] = JSON.stringify(r);
  return snap;
}

// Loads the org's data into the store and primes snapshots so the sync
// subscriber starts from a clean baseline (no spurious writes on first render).
export async function loadOrgData(): Promise<void> {
  const [
    groups,
    entities,
    employees,
    suppliers,
    purchaseRequests,
    bankTransactions,
    inventory,
    balanceItems,
    financeInputs,
    budgetPlans,
    invoices,
    costCenters,
    intercompanyFlows,
    liquidityLines,
    kpiTargets,
    risks,
    premortems,
    strategyDecisions,
    approvals,
    uploads,
    auditLog,
  ] = await Promise.all([
    api.listRecords("groups"),
    api.listRecords("entities"),
    api.listRecords("employees"),
    api.listRecords("suppliers"),
    api.listRecords("purchaseRequests"),
    api.listRecords("bankTransactions"),
    api.listRecords("inventory"),
    api.listRecords("balanceItems"),
    api.listRecords("financeInputs"),
    api.listRecords("budgetPlans"),
    api.listRecords("invoices"),
    api.listRecords("costCenters"),
    api.listRecords("intercompanyFlows"),
    api.listRecords("liquidityLines"),
    api.listRecords("kpiTargets"),
    api.listRecords("risks"),
    api.listRecords("premortems"),
    api.listRecords("strategyDecisions"),
    api.listRecords("approvals"),
    api.listRecords("uploads"),
    api.listRecords("auditLog"),
  ]);

  useAppStore.getState().hydrate({
    groups,
    entities,
    employees,
    suppliers,
    purchaseRequests,
    bankTransactions,
    inventory,
    balanceItems,
    financeInputs,
    budgetPlans,
    invoices,
    costCenters,
    intercompanyFlows,
    liquidityLines,
    kpiTargets,
    risks,
    premortems,
    strategyDecisions,
    approvals,
    uploads,
    auditLog,
  });

  for (const kind of KINDS) snapshots[kind] = snapshotOf(kind, rows(kind));
}

async function syncDomain(kind: api.DomainKind): Promise<void> {
  const next = snapshotOf(kind, rows(kind));
  const prev = snapshots[kind];

  for (const [id, json] of Object.entries(next)) {
    if (prev[id] === json) continue;
    try {
      await api.putRecord(kind, id, JSON.parse(json));
      prev[id] = json; // commit only on success so failures retry next pass
    } catch (err) {
      console.error(`[sync] failed to save ${kind}/${id}`, err);
    }
  }

  for (const id of Object.keys(prev)) {
    if (id in next) continue;
    try {
      await api.deleteRecord(kind, id);
      delete prev[id];
    } catch (err) {
      console.error(`[sync] failed to delete ${kind}/${id}`, err);
    }
  }
}

async function run(): Promise<void> {
  running = true;
  try {
    while (dirty && enabled) {
      dirty = false;
      for (const kind of KINDS) {
        if (!enabled) break;
        await syncDomain(kind);
      }
    }
  } finally {
    running = false;
  }
}

function schedule(): void {
  if (!enabled) return;
  dirty = true;
  if (!running) void run();
}

// Begins watching the store and pushing every create/update/delete of the eight
// DB-backed domains to the org-scoped API. Call after loadOrgData().
export function startSync(): void {
  enabled = true;
  if (!unsubscribe) unsubscribe = useAppStore.subscribe(() => schedule());
}

// Stops syncing and clears baselines (call on sign-out / org switch).
export function stopSync(): void {
  enabled = false;
  dirty = false;
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  for (const kind of KINDS) snapshots[kind] = {};
}
