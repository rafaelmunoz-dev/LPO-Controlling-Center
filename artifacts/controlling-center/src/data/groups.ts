import type { CompanyGroup, EntityCode, EntityMeta, GroupViewKey, ViewKey } from "./types";

// Default (seed) group. Legacy "MiGu Group Gesamt" maps to this group's total.
export const DEFAULT_GROUP_ID = "migu";

export const GROUPS: CompanyGroup[] = [{ id: DEFAULT_GROUP_ID, name: "MiGu Group" }];

const GROUP_PREFIX = "group:";

export function groupViewKey(id: string): GroupViewKey {
  return `${GROUP_PREFIX}${id}`;
}

export function isGroupView(view: ViewKey): boolean {
  return typeof view === "string" && view.startsWith(GROUP_PREFIX);
}

export function groupIdFromView(view: ViewKey): string | null {
  return isGroupView(view) ? (view as string).slice(GROUP_PREFIX.length) : null;
}

// ---------------------------------------------------------------------------
// Live registry: mirrors the current store's groups + entities so the pure
// finance/scope helpers can resolve group membership without threading state
// through every call site. The store keeps this in sync (see use-app-context).
// finance.ts seeds it at module load so first-render aggregation is correct.
// ---------------------------------------------------------------------------
let registeredEntities: EntityMeta[] = [];
let registeredGroups: CompanyGroup[] = [];

export function setRegistry(entities: EntityMeta[], groups: CompanyGroup[]) {
  registeredEntities = entities;
  registeredGroups = groups;
}

export function registryEntities(): EntityMeta[] {
  return registeredEntities;
}

export function registryGroups(): CompanyGroup[] {
  return registeredGroups;
}

// Non-archived firms belonging to a group.
export function firmsInGroup(groupId: string): EntityMeta[] {
  return registeredEntities.filter((e) => e.groupId === groupId && !e.archived);
}

export function firmCodesInGroup(groupId: string): EntityCode[] {
  return firmsInGroup(groupId).map((e) => e.code);
}

// The firm codes "covered" by a view: a group view expands to its non-archived
// firms; a firm view is just that one code.
export function entityCodesForView(view: ViewKey): EntityCode[] {
  const gid = groupIdFromView(view);
  if (gid) return firmCodesInGroup(gid);
  return [view as EntityCode];
}

// Human-readable label for a view (group name, or firm code).
export function labelForView(view: ViewKey): string {
  const gid = groupIdFromView(view);
  if (gid) return registeredGroups.find((g) => g.id === gid)?.name ?? "Gruppe";
  return view as string;
}

// A sensible firm to default an entity-scoped form to for the current view.
export function defaultFirmForView(view: ViewKey): EntityCode | undefined {
  const gid = groupIdFromView(view);
  if (gid) {
    const inGroup = firmsInGroup(gid)[0];
    if (inGroup) return inGroup.code;
    return registeredEntities.find((e) => !e.archived)?.code;
  }
  return view as EntityCode;
}
