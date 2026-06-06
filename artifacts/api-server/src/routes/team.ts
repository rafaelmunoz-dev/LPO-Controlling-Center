import { randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, memberships, invitations } from "@workspace/db";
import {
  requireAuth,
  requireMembership,
  isOrgAdmin,
  VALID_ROLES,
  type Role,
} from "../lib/auth";

const router: IRouter = Router();

// List all members of the caller's organization (admins only). Team management
// is an admin-scoped surface, so non-admins must not be able to enumerate the
// org's membership roster even via a direct API call.
router.get("/members", requireAuth, requireMembership, async (req, res) => {
  const m = req.ctx!.membership!;
  if (!isOrgAdmin(m.role)) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  const rows = await db
    .select()
    .from(memberships)
    .where(eq(memberships.organizationId, m.organizationId));
  res.json(rows);
});

// List pending invitations for the caller's organization (admins only).
router.get("/invitations", requireAuth, requireMembership, async (req, res) => {
  const m = req.ctx!.membership!;
  if (!isOrgAdmin(m.role)) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  const rows = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.organizationId, m.organizationId),
        eq(invitations.status, "pending"),
      ),
    );
  res.json(rows);
});

// Create an invitation (admins only). Returns the invitation incl. token so the
// frontend can build a shareable link. No email is sent in Phase 1.
router.post("/invitations", requireAuth, requireMembership, async (req, res) => {
  const m = req.ctx!.membership!;
  if (!isOrgAdmin(m.role)) {
    res.status(403).json({ error: "forbidden" });
    return;
  }

  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  const role = String(req.body?.role ?? "") as Role;
  const managedEntities = Array.isArray(req.body?.managedEntities)
    ? req.body.managedEntities.filter((x: unknown) => typeof x === "string")
    : [];

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ error: "invalid_email" });
    return;
  }
  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ error: "invalid_role" });
    return;
  }

  const [existingMember] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, m.organizationId),
        eq(memberships.email, email),
      ),
    )
    .limit(1);
  if (existingMember) {
    res.status(409).json({ error: "already_member" });
    return;
  }

  // Replace any existing pending invite for the same email in this org.
  await db
    .update(invitations)
    .set({ status: "revoked" })
    .where(
      and(
        eq(invitations.organizationId, m.organizationId),
        eq(invitations.email, email),
        eq(invitations.status, "pending"),
      ),
    );

  const token = randomBytes(24).toString("base64url");
  const [inv] = await db
    .insert(invitations)
    .values({
      organizationId: m.organizationId,
      email,
      role,
      managedEntities,
      token,
      invitedByClerkUserId: m.clerkUserId,
      invitedByName: m.name,
    })
    .returning();

  res.json(inv);
});

// Change a member's role (admins only). Protects against removing the last
// Admin in the org: an Admin can only be demoted while another Admin remains.
router.patch(
  "/members/:id/role",
  requireAuth,
  requireMembership,
  async (req, res) => {
    const m = req.ctx!.membership!;
    if (!isOrgAdmin(m.role)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const role = String(req.body?.role ?? "") as Role;
    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ error: "invalid_role" });
      return;
    }

    const [target] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.id, String(req.params.id)),
          eq(memberships.organizationId, m.organizationId),
        ),
      )
      .limit(1);

    if (!target) {
      res.status(404).json({ error: "member_not_found" });
      return;
    }

    // Last-admin protection: block demoting the only remaining Admin.
    if (target.role === "Admin" && role !== "Admin") {
      const admins = await db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.organizationId, m.organizationId),
            eq(memberships.role, "Admin"),
          ),
        );
      if (admins.length <= 1) {
        res.status(409).json({ error: "last_admin" });
        return;
      }
    }

    const patch: { role: Role; jobTitle?: string } = { role };
    if (req.body?.jobTitle !== undefined) {
      patch.jobTitle = String(req.body.jobTitle).trim();
    }

    const [updated] = await db
      .update(memberships)
      .set(patch)
      .where(eq(memberships.id, target.id))
      .returning();

    res.json(updated);
  },
);

// Revoke a pending invitation (admins only).
router.delete(
  "/invitations/:id",
  requireAuth,
  requireMembership,
  async (req, res) => {
    const m = req.ctx!.membership!;
    if (!isOrgAdmin(m.role)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    await db
      .update(invitations)
      .set({ status: "revoked" })
      .where(
        and(
          eq(invitations.id, String(req.params.id)),
          eq(invitations.organizationId, m.organizationId),
        ),
      );
    res.json({ ok: true });
  },
);

export default router;
