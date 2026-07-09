import { ALL_VIEW, type AllViewKey, type CompanyGroup, type EntityCode, type EntityMeta, type GroupViewKey, type ViewKey } from "./types";

// Default (seed) group. Legacy total view maps to this group's total.
export const DEFAULT_GROUP_ID = "migu";

export const GROUPS: CompanyGroup[] = [{ id: DEFAULT_GROUP_ID, name: "Unternehmensgruppe" }];

const GROUP_PREFIX = "group:";

export function groupViewKey(id: string): GroupViewKey {
  return `${GROUP_PREFIX}${id}`;
}

export function isGroupView(view: ViewKey): boolean {
  return typeof view === "string" && view.startsWith(GROUP_PREFIX);
}

export function isAllView(view: ViewKey): view is AllViewKey {
  return view === ALL_VIEW;
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

// The firm codes "covered" by a view: the consolidated view expands to every
// non-archived firm (grouped or not); a group view expands to its
// non-archived firms; a firm view is just that one code.
export function entityCodesForView(view: ViewKey): EntityCode[] {
  if (isAllView(view)) {
    return registeredEntities.filter((e) => !e.archived).map((e) => e.code);
  }
  const gid = groupIdFromView(view);
  if (gid) return firmCodesInGroup(gid);
  return [view as EntityCode];
}

// Human-readable label for a view (group name, or firm code).
export function labelForView(view: ViewKey): string {
  if (isAllView(view)) return "Alle Firmen";
  const gid = groupIdFromView(view);
  if (gid) return registeredGroups.find((g) => g.id === gid)?.name ?? "Gruppe";
  return view as string;
}

// A sensible firm to default an entity-scoped form to for the current view.
export function defaultFirmForView(view: ViewKey): EntityCode | undefined {
  if (isAllView(view)) return registeredEntities.find((e) => !e.archived)?.code;
  const gid = groupIdFromView(view);
  if (gid) {
    const inGroup = firmsInGroup(gid)[0];
    if (inGroup) return inGroup.code;
    return registeredEntities.find((e) => !e.archived)?.code;
  }
  return view as EntityCode;
}
