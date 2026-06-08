---
name: Controlling Center tab hubs
description: Rules for merging separately-routed pages into a single tabbed hub (RBAC + wouter hash deep-linking)
---

When you collapse several separately-routed pages into one page with tabs (e.g. the Finanzen hub absorbing Umsatz/GuV/Prognosen/Berichte):

## Re-apply per-tab RBAC
**Rule:** Each tab that used to be its own guarded route must carry its own `NavKey` and be filtered by `allowedNav()`. Filter the visible tab list AND validate the initial/hash-driven tab, falling back to a baseline tab the route guard already guarantees (e.g. `overview` → `finanzen`).
**Why:** AuthedApp only guards the hub's single route now; rendering sub-views unconditionally drops the per-submodule authorization boundary. Today all non-admin roles happen to share the same nav keys, so nothing breaks at runtime — but the boundary is gone and silently re-opens if the permission matrix ever diverges.
**How to apply:** Map `tab -> NavKey`, `visibleTabs = TAB_DEFS.filter(d => allowedNav().includes(d.navKey))`, gate the `useState` initializer and the `hashchange` listener on that same check.

## wouter hash deep-linking pitfall
**Rule:** wouter `navigate('/finanzen#berichte')` does NOT fire a `hashchange` event and does NOT remount the page when you are already on `/finanzen` (pushState without event). A hub that derives its tab only from a `hashchange` listener + mount-time hash read will ignore same-page deep links.
**Why:** pushState/replaceState never emit `hashchange`; wouter's location excludes the hash, so `useLocation` won't re-fire either when only the hash changes.
**How to apply:** Cross-page links (caller is never on the hub, e.g. Dashboard) work via mount-time hash read — single-arg navigate is fine. For callers that may already be on the hub (e.g. global Topbar buttons), split it: `navigate('/finanzen'); window.location.hash = 'berichte';` — assigning `window.location.hash` always fires `hashchange`.
