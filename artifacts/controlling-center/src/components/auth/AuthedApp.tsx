import { useCallback, useEffect, useState } from "react";
import { Switch, Route, Link } from "wouter";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/hooks/use-app-context";
import type { NavKey } from "@/data/governance";
import type { AppUser } from "@/data/types";
import { INVITE_TOKEN_KEY } from "@/auth/clerk";
import * as api from "@/lib/api";
import { loadOrgData, startSync, stopSync } from "@/lib/data-sync";
import Onboarding from "@/pages/Onboarding";
import InvitePrompt from "@/pages/InvitePrompt";
import Dashboard from "@/pages/Dashboard";
import Finanzen from "@/pages/Finanzen";
import Belege from "@/pages/Belege";
import Umsatz from "@/pages/Umsatz";
import Einkauf from "@/pages/Einkauf";
import Inventar from "@/pages/Inventar";
import Mitarbeiter from "@/pages/Mitarbeiter";
import Freigaben from "@/pages/Freigaben";
import Prognosen from "@/pages/Prognosen";
import Risiko from "@/pages/Risiko";
import Strategie from "@/pages/Strategie";
import Entitaeten from "@/pages/Entitaeten";
import GewinnVerlust from "@/pages/GewinnVerlust";
import AuditLog from "@/pages/AuditLog";
import Reports from "@/pages/Reports";
import Einstellungen from "@/pages/Einstellungen";
import ProfileSettings from "@/pages/ProfileSettings";
import NotFound from "@/pages/not-found";

export type OnActivated = (resp: api.ActiveResponse) => Promise<void>;

function membershipToUser(m: api.Membership, orgName: string): AppUser {
  return {
    id: m.clerkUserId,
    name: m.name || m.email,
    role: m.role,
    jobTitle: m.jobTitle ?? "",
    organisation: orgName,
    email: m.email,
    language: useAppStore.getState().language,
    avatar: m.avatar ?? "",
    entityAccess: [],
    lastActivity: new Date().toISOString().slice(0, 16).replace("T", " "),
    tasks: [],
  };
}

async function activate(resp: api.ActiveResponse): Promise<void> {
  const orgName = resp.organization?.name ?? "";
  useAppStore.getState().setSession(membershipToUser(resp.membership, orgName));
  await loadOrgData();
  startSync();
}

function AccessDenied() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center" data-testid="access-denied">
      <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold">{t("access_denied")}</h2>
      <p className="text-muted-foreground mt-1 mb-5 max-w-sm">{t("access_denied_desc")}</p>
      <Link href="/"><Button>{t("back_to_dashboard")}</Button></Link>
    </div>
  );
}

function Guarded({ navKey, component: Component }: { navKey: NavKey; component: ComponentType }) {
  const allowedNav = useAppStore((s) => s.allowedNav);
  if (!allowedNav().includes(navKey)) return <AccessDenied />;
  return <Component />;
}

function AppShell() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/">{() => <Guarded navKey="dashboard" component={Dashboard} />}</Route>
        <Route path="/finanzen">{() => <Guarded navKey="finanzen" component={Finanzen} />}</Route>
        <Route path="/belege">{() => <Guarded navKey="belege" component={Belege} />}</Route>
        <Route path="/umsatz">{() => <Guarded navKey="umsatz" component={Umsatz} />}</Route>
        <Route path="/einkauf">{() => <Guarded navKey="einkauf" component={Einkauf} />}</Route>
        <Route path="/inventar">{() => <Guarded navKey="inventar" component={Inventar} />}</Route>
        <Route path="/mitarbeiter">{() => <Guarded navKey="mitarbeiter" component={Mitarbeiter} />}</Route>
        <Route path="/freigaben">{() => <Guarded navKey="freigaben" component={Freigaben} />}</Route>
        <Route path="/prognosen">{() => <Guarded navKey="prognosen" component={Prognosen} />}</Route>
        <Route path="/risiko">{() => <Guarded navKey="risiko" component={Risiko} />}</Route>
        <Route path="/strategie">{() => <Guarded navKey="strategie" component={Strategie} />}</Route>
        <Route path="/entitaeten">{() => <Guarded navKey="entitaeten" component={Entitaeten} />}</Route>
        <Route path="/gewinn-verlust">{() => <Guarded navKey="gewinnverlust" component={GewinnVerlust} />}</Route>
        <Route path="/audit">{() => <Guarded navKey="audit" component={AuditLog} />}</Route>
        <Route path="/reports">{() => <Guarded navKey="reports" component={Reports} />}</Route>
        <Route path="/einstellungen">{() => <Guarded navKey="einstellungen" component={Einstellungen} />}</Route>
        <Route path="/profil">{() => <ProfileSettings />}</Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

type Phase =
  | { phase: "loading" }
  | { phase: "active" }
  | { phase: "no_org" }
  | { phase: "invited"; invites: api.PendingInvite[] }
  | { phase: "error" };

export function AuthedApp() {
  const { t } = useTranslation();
  const [state, setState] = useState<Phase>({ phase: "loading" });

  const bootstrap = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const me = await api.getMe();
      if (me.status === "active") {
        await activate(me);
        setState({ phase: "active" });
        return;
      }

      // Redeem a shareable invite link (?invite=...) captured before auth, even
      // if the signed-in email doesn't match the invited address.
      const inviteToken = sessionStorage.getItem(INVITE_TOKEN_KEY);
      if (inviteToken) {
        sessionStorage.removeItem(INVITE_TOKEN_KEY);
        try {
          const resp = await api.acceptInvite(inviteToken);
          await activate(resp);
          setState({ phase: "active" });
          return;
        } catch (err) {
          console.error("[auth] invite link redemption failed", err);
        }
      }

      if (me.status === "invited") {
        setState({ phase: "invited", invites: me.invitations });
      } else {
        setState({ phase: "no_org" });
      }
    } catch (err) {
      console.error("[auth] bootstrap failed", err);
      setState({ phase: "error" });
    }
  }, []);

  // New organizations start completely empty — the owner (Admin) creates
  // their first group/company from Einstellungen → Entitäten. No data is seeded.
  const handleActivated = useCallback<OnActivated>(async (resp) => {
    await activate(resp);
    setState({ phase: "active" });
  }, []);

  useEffect(() => {
    bootstrap();
    return () => {
      stopSync();
      useAppStore.getState().resetData();
    };
  }, [bootstrap]);

  if (state.phase === "loading") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-slate-50 text-slate-500">
        <Loader2 className="h-7 w-7 animate-spin text-teal-500" />
        <p className="text-sm">{t("loading_workspace")}</p>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <ShieldAlert className="h-10 w-10 text-rose-500" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("error_loading_title")}</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">{t("error_loading_desc")}</p>
        </div>
        <Button onClick={() => bootstrap()}>{t("retry")}</Button>
      </div>
    );
  }

  if (state.phase === "no_org") {
    return <Onboarding onActivated={handleActivated} />;
  }

  if (state.phase === "invited") {
    return <InvitePrompt invites={state.invites} onActivated={handleActivated} />;
  }

  return <AppShell />;
}
