import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useClerk } from "@clerk/react";
import { Loader2, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as api from "@/lib/api";
import type { OnActivated } from "@/components/auth/AuthedApp";
import { basePath } from "@/auth/clerk";

export default function InvitePrompt({
  invites,
  onActivated,
}: {
  invites: api.PendingInvite[];
  onActivated: OnActivated;
}) {
  const { t } = useTranslation();
  const { signOut } = useClerk();
  const [busyToken, setBusyToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accept = async (token: string) => {
    if (busyToken) return;
    setBusyToken(token);
    setError(null);
    try {
      const resp = await api.acceptInvite(token);
      await onActivated(resp);
    } catch (err) {
      console.error("[invite] accept failed", err);
      setError(t("inv_error"));
      setBusyToken(null);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="mb-6 flex items-center gap-3">
          <img src={`${basePath}/logo.svg`} alt="LPO Controlling Center" className="h-9 w-auto" />
        </div>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">{t("inv_title")}</h1>
        <p className="mt-1.5 text-sm text-slate-500">{t("invite_subtitle")}</p>

        <div className="mt-6 space-y-3">
          {invites.map((inv) => (
            <div
              key={inv.token}
              className="rounded-xl border border-slate-200 p-4"
              data-testid={`invite-${inv.token}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900">{inv.organizationName}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <Badge variant="outline">{t("inv_role")}: {inv.role}</Badge>
                    {inv.invitedByName && <span>{t("inv_from")} {inv.invitedByName}</span>}
                  </div>
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => accept(inv.token)}
                disabled={busyToken !== null}
                data-testid={`button-accept-${inv.token}`}
              >
                {busyToken === inv.token
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("inv_accepting")}</>
                  : t("inv_accept")}
              </Button>
            </div>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-rose-600" data-testid="text-inv-error">{error}</p>}

        <button
          type="button"
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
          data-testid="button-inv-signout"
        >
          <LogOut className="h-3.5 w-3.5" /> {t("logout")}
        </button>
      </div>
    </div>
  );
}
