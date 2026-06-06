import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, organizations, memberships, invitations } from "@workspace/db";
import { requireAuth, requireMembership } from "../lib/auth";

const MAX_AVATAR_LEN = 2_000_000;

const router: IRouter = Router();

// Returns the signed-in user's state:
// - "active": has a membership → returns membership + organization
// - "invited": no membership but pending invitation(s) for their email
// - "no_org": no membership and no invites → onboarding (create org)
router.get("/me", requireAuth, async (req, res) => {
  const { user, membership } = req.ctx!;

  if (membership) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, membership.organizationId))
      .limit(1);
    res.json({ status: "active", user, membership, organization: org ?? null });
    return;
  }

  if (user.email) {
    const invites = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, user.email),
          eq(invitations.status, "pending"),
        ),
      );

    if (invites.length > 0) {
      const enriched = await Promise.all(
        invites.map(async (inv) => {
          const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, inv.organizationId))
            .limit(1);
          return {
            token: inv.token,
            role: inv.role,
            organizationName: org?.name ?? "",
            invitedByName: inv.invitedByName,
          };
        }),
      );
      res.json({ status: "invited", user, invitations: enriched });
      return;
    }
  }

  res.json({ status: "no_org", user });
});

// Create a brand-new (empty) organization. The creator becomes the owner and
// the first Admin. Only allowed when the user has no membership yet.
router.post("/org", requireAuth, async (req, res) => {
  if (req.ctx!.membership) {
    res.status(409).json({ error: "already_in_org" });
    return;
  }
  const { user } = req.ctx!;
  const name = String(req.body?.name ?? "").trim();
  if (!name) {
    res.status(400).json({ error: "name_required" });
    return;
  }
  const ownerName = String(req.body?.ownerName ?? "").trim() || user.name;

  const [org] = await db
    .insert(organizations)
    .values({ name, ownerClerkUserId: user.clerkUserId })
    .returning();

  const [m] = await db
    .insert(memberships)
    .values({
      organizationId: org.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: ownerName,
      role: "Admin",
    })
    .returning();

  res.json({ status: "active", user, membership: m, organization: org });
});

// Update the signed-in user's own profile (display name, job title, avatar).
// Available to every member regardless of role.
router.patch("/me/profile", requireAuth, requireMembership, async (req, res) => {
  const m = req.ctx!.membership!;
  const patch: { name?: string; jobTitle?: string; avatar?: string } = {};

  if (req.body?.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) {
      res.status(400).json({ error: "name_required" });
      return;
    }
    patch.name = name;
  }
  if (req.body?.jobTitle !== undefined) {
    patch.jobTitle = String(req.body.jobTitle).trim();
  }
  if (req.body?.avatar !== undefined) {
    const avatar = String(req.body.avatar);
    if (avatar.length > MAX_AVATAR_LEN) {
      res.status(400).json({ error: "avatar_too_large" });
      return;
    }
    patch.avatar = avatar;
  }

  if (Object.keys(patch).length === 0) {
    res.json(m);
    return;
  }

  const [updated] = await db
    .update(memberships)
    .set(patch)
    .where(eq(memberships.id, m.id))
    .returning();

  res.json(updated);
});

// Accept an invitation by token (auto-detected on login or via shareable link).
// Only allowed when the user has no membership yet.
router.post("/invitations/accept", requireAuth, async (req, res) => {
  if (req.ctx!.membership) {
    res.status(409).json({ error: "already_in_org" });
    return;
  }
  const { user } = req.ctx!;
  const token = String(req.body?.token ?? "").trim();
  if (!token) {
    res.status(400).json({ error: "token_required" });
    return;
  }

  const [inv] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);

  if (!inv || inv.status !== "pending") {
    res.status(404).json({ error: "invite_invalid" });
    return;
  }

  const [m] = await db
    .insert(memberships)
    .values({
      organizationId: inv.organizationId,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      role: inv.role,
      managedEntities: inv.managedEntities,
    })
    .returning();

  await db
    .update(invitations)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(invitations.id, inv.id));

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, inv.organizationId))
    .limit(1);

  res.json({ status: "active", user, membership: m, organization: org });
});

export default router;
