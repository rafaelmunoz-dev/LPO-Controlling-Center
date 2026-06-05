import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, memberships, type Membership } from "@workspace/db";
import type { DomainKind } from "@workspace/db";

export type Role =
  | "Controller"
  | "Geschäftsführer"
  | "Finanzbuchhalter"
  | "Mitarbeiter";

export const VALID_ROLES: Role[] = [
  "Controller",
  "Geschäftsführer",
  "Finanzbuchhalter",
  "Mitarbeiter",
];

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

// Team management lives in Einstellungen, which is Controller-only on the client
// (SETTINGS_ADMIN_ROLES in src/data/governance.ts). The org owner is created as a
// Controller, so restricting invitations to Controller matches the "owner
// invites" model and prevents in-tenant privilege escalation (a Geschäftsführer
// inviting users as Controller).
export function isOrgAdmin(role: string): boolean {
  return role === "Controller";
}

type WriteAction = "create" | "update" | "delete";

// Server-side authorization backstop mirroring src/data/governance.ts. Tenant
// isolation (org scoping) is enforced separately on every query; this is the
// role gate. The frontend enforces the fine-grained, entity-scoped rules — here
// we enforce the coarse per-domain role policy so direct API calls can't bypass
// it. Each entry lists the roles permitted to write (create/update/delete) the
// domain; entity edit/delete is narrowed further below.
const DOMAIN_WRITE_ROLES: Record<DomainKind, Role[]> = {
  // Org structure & financial structure → Controller only.
  groups: ["Controller"],
  suppliers: ["Controller"],
  balanceItems: ["Controller"],
  // Companies: Controller (global) or Geschäftsführer (within their group).
  entities: ["Controller", "Geschäftsführer"],
  // Employees: Controller, or Geschäftsführer within their group.
  employees: ["Controller", "Geschäftsführer"],
  // Purchase requests are the broadly-writable operational domain.
  purchaseRequests: [
    "Controller",
    "Geschäftsführer",
    "Finanzbuchhalter",
    "Mitarbeiter",
  ],
  // Bank statements & inventory: Controller and Finanzbuchhalter.
  bankTransactions: ["Controller", "Finanzbuchhalter"],
  inventory: ["Controller", "Finanzbuchhalter"],
};

export function canWriteDomain(opts: {
  role: string;
  kind: DomainKind;
  action: WriteAction;
}): boolean {
  const { role, kind, action } = opts;
  // Existing companies may only be edited/removed by the Controller; a
  // Geschäftsführer may only create one (scoped to their group on the client).
  if (kind === "entities" && (action === "update" || action === "delete")) {
    return role === "Controller";
  }
  return (DOMAIN_WRITE_ROLES[kind] ?? ["Controller"]).includes(role as Role);
}
