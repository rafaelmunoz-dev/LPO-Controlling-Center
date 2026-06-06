import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Loader2, Mail, Send, Trash2, UserCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAppStore } from "@/hooks/use-app-context";
import { basePath } from "@/auth/clerk";
import { AdminBadge } from "@/components/shared/AdminBadge";
import { isAdmin } from "@/data/governance";
import * as api from "@/lib/api";

const ROLES: api.MembershipRole[] = ["Admin", "Mitarbeiter", "Betrachter"];

function roleLabelKey(role: api.MembershipRole): string {
  return `role_${role.toLowerCase()}`;
}

function inviteLink(token: string): string {
  return `${window.location.origin}${basePath}/sign-up?invite=${token}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function TeamSettings() {
  const { t } = useTranslation();
  const currentUser = useAppStore((s) => s.currentUser);
  const admin = isAdmin(currentUser.role);

  const [members, setMembers] = useState<api.Membership[]>([]);
  const [invitations, setInvitations] = useState<api.Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<api.MembershipRole>("Mitarbeiter");
  const [sending, setSending] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [m, inv] = await Promise.all([
        api.listMembers(),
        admin ? api.listInvitations() : Promise.resolve<api.Invitation[]>([]),
      ]);
      setMembers(m);
      setInvitations(inv);
    } catch (err) {
      console.error("[team] load failed", err);
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const inv = await api.createInvitation({ email: trimmed, role });
      setInvitations((prev) => [inv, ...prev]);
      setEmail("");
      const copied = await copyToClipboard(inviteLink(inv.token));
      toast.success(copied ? t("team_invite_created") : t("team_copy_link"));
    } catch (err) {
      console.error("[team] createInvitation failed", err);
      toast.error(t("team_invite_error"));
    } finally {
      setSending(false);
    }
  };

  const copyLink = async (token: string) => {
    const copied = await copyToClipboard(inviteLink(token));
    if (copied) toast.success(t("team_link_copied"));
  };

  const revoke = async (id: string) => {
    try {
      await api.revokeInvitation(id);
      setInvitations((prev) => prev.filter((i) => i.id !== id));
      toast.success(t("team_revoked"));
    } catch (err) {
      console.error("[team] revoke failed", err);
      toast.error(t("team_invite_error"));
    }
  };

  const changeRole = async (m: api.Membership, next: api.MembershipRole) => {
    if (next === m.role || updatingRole) return;
    setUpdatingRole(m.id);
    try {
      const updated = await api.updateMemberRole(m.id, next);
      setMembers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast.success(t("team_role_updated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("last_admin")) toast.error(t("team_last_admin"));
      else toast.error(t("team_role_update_error"));
      console.error("[team] updateMemberRole failed", err);
    } finally {
      setUpdatingRole(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> {t("team_members_title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("team_subtitle")}</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("loading_workspace")}
            </div>
          ) : members.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">{t("team_no_members")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("set_users")}</TableHead>
                  <TableHead>{t("team_job_title")}</TableHead>
                  <TableHead>{t("set_role")}</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const isYou = m.clerkUserId === currentUser.id;
                  return (
                    <TableRow key={m.clerkUserId} data-testid={`row-member-${m.clerkUserId}`} className={isYou ? "bg-primary/5" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={m.avatar || undefined} alt={m.name || m.email} />
                            <AvatarFallback>{(m.name || m.email).charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-1.5">
                              {m.name || m.email}
                              {m.role === "Admin" && <AdminBadge />}
                            </div>
                            <div className="text-xs text-muted-foreground">{m.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.jobTitle || "—"}</TableCell>
                      <TableCell>
                        {admin ? (
                          <Select
                            value={m.role}
                            onValueChange={(v) => changeRole(m, v as api.MembershipRole)}
                            disabled={updatingRole === m.id}
                          >
                            <SelectTrigger className="h-8 w-[150px]" data-testid={`select-role-${m.clerkUserId}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => <SelectItem key={r} value={r}>{t(roleLabelKey(r))}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{t(roleLabelKey(m.role))}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isYou && <span className="inline-flex items-center gap-1 text-emerald-600 text-sm"><UserCheck className="h-4 w-4" /> {t("team_you")}</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {admin && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> {t("team_invite_title")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t("team_share_hint")}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={submitInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="invite-email">{t("team_email_label")}</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("team_email_placeholder")}
                  data-testid="input-invite-email"
                />
              </div>
              <div className="space-y-1.5 sm:w-56">
                <Label>{t("team_role_label")}</Label>
                <Select value={role} onValueChange={(v) => setRole(v as api.MembershipRole)}>
                  <SelectTrigger data-testid="select-invite-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{t(roleLabelKey(r))}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={!email.trim() || sending} data-testid="button-send-invite">
                {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("team_sending")}</> : <><Send className="mr-2 h-4 w-4" /> {t("team_send")}</>}
              </Button>
            </form>

            <div>
              <h4 className="mb-2 text-sm font-medium">{t("team_pending_title")}</h4>
              {invitations.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("team_no_pending")}</p>
              ) : (
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                      data-testid={`row-invite-${inv.id}`}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{inv.email}</div>
                        <div className="text-xs text-muted-foreground">{t(roleLabelKey(inv.role))}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => copyLink(inv.token)} data-testid={`button-copy-${inv.id}`}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => revoke(inv.id)} data-testid={`button-revoke-${inv.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
