import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useClerk } from "@clerk/react";
import { Building2, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as api from "@/lib/api";
import type { OnActivated } from "@/components/auth/AuthedApp";
import { basePath } from "@/auth/clerk";

export default function Onboarding({ onActivated }: { onActivated: OnActivated }) {
  const { t } = useTranslation();
  const { signOut } = useClerk();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const resp = await api.createOrg(trimmed);
      await onActivated(resp);
    } catch (err) {
      console.error("[onboarding] createOrg failed", err);
      setError(t("onb_error"));
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="mb-6 flex items-center gap-3">
          <img src={`${basePath}/logo.svg`} alt="LPO Controlling Center" className="h-9 w-auto" />
        </div>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">{t("onb_title")}</h1>
        <p className="mt-1.5 text-sm text-slate-500">{t("onb_subtitle")}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org-name">{t("onb_org_label")}</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("onb_org_placeholder")}
              autoFocus
              data-testid="input-org-name"
            />
          </div>
          {error && <p className="text-sm text-rose-600" data-testid="text-onb-error">{error}</p>}
          <Button type="submit" className="w-full" disabled={!name.trim() || busy} data-testid="button-create-org">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("onb_creating")}</> : t("onb_create")}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
          data-testid="button-onb-signout"
        >
          <LogOut className="h-3.5 w-3.5" /> {t("logout")}
        </button>
      </div>
    </div>
  );
}
