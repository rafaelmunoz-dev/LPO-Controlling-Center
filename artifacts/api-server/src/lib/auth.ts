import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, memberships, type Membership } from "@workspace/db";
import type { DomainKind } from "@workspace/db";

// Permission levels (see src/data/governance.ts on the client):
//   Admin       — full rights, incl. structural & system settings.
//   Mitarbeiter — operational create/edit on domain data (no delete, no
//                 structural groups/entities, no system settings).
//   Betrachter  — read-only.
export type Role = "Admin" | "Mitarbeiter" | "Betrachter";

export const VALID_ROLES: Role[] = ["Admin", "Mitarbeiter", "Betrachter"];

export interface ReqUser {
  clerkUserId: string;
  email: string;
  name: string;
}

export interface AuthCtx {
  user: ReqUser;
  membership: Membership | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      ctx?: AuthCtx;
    }
  }
}

// Authenticates the Clerk session and resolves the user's identity + membership.
// To avoid a Clerk API round-trip on every request, we read email/name from the
// stored membership when one exists, and only fetch the Clerk user (for email)
// when the user has no membership yet (onboarding / invite acceptance).
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = getAuth(req)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [m] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.clerkUserId, userId))
      .limit(1);

    let email = m?.email ?? "";
    let name = m?.name ?? "";

    if (!m) {
      const cu = await clerkClient.users.getUser(userId);
      email = (
        cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)
          ?.emailAddress ??
        cu.emailAddresses[0]?.emailAddress ??
        ""
      ).toLowerCase();
      name =
        [cu.firstName, cu.lastName].filter(Boolean).join(" ") ||
        cu.username ||
        email;
    }

    req.ctx = {
      user: { clerkUserId: userId, email, name },
      membership: m ?? null,
    };
    next();
  } catch (err) {
    req.log?.error({ err }, "requireAuth failed to resolve user");
    res.status(401).json({ error: "Unauthorized" });
  }
}

// Requires the authenticated user to have an active membership in an org.
export function requireMembership(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const m = req.ctx?.membership;
  if (!m || m.status !== "active") {
    res.status(403).json({ error: "no_active_membership" });
    return;
  }
  next();
}

// Team management (invites, role changes) and system settings are Admin-only on
// the client (SETTINGS_ADMIN_ROLES in src/data/governance.ts). The org owner is
// created as Admin, so restricting these actions to Admin matches the "owner
// invites" model and prevents in-tenant privilege escalation.
export function isOrgAdmin(role: string): boolean {
  return role === "Admin";
}

type WriteAction = "create" | "update" | "delete";

// Structural domains define the org's shape (company groups & companies). They
// are managed in system settings and are therefore Admin-only.
const STRUCTURAL_DOMAINS: DomainKind[] = ["groups", "entities"];

// Server-side authorization backstop mirroring src/data/governance.ts. Tenant
// isolation (org scoping) is enforced separately on every query; this is the
// role gate so direct API calls can't bypass the client policy.
//   Admin       → write everything.
//   Betrachter  → write nothing.
//   Mitarbeiter → create/update operational (non-structural) domains; never
//                 delete, never touch structural domains.
export function canWriteDomain(opts: {
  role: string;
  kind: DomainKind;
  action: WriteAction;
}): boolean {
  const { role, kind, action } = opts;
  if (role === "Admin") return true;
  if (role === "Betrachter") return false;
  if (role === "Mitarbeiter") {
    if (STRUCTURAL_DOMAINS.includes(kind)) return false;
    return action === "create" || action === "update";
  }
  return false;
}
