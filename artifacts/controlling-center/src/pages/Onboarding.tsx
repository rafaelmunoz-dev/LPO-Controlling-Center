import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useClerk } from "@clerk/react";
import { Building2, Loader2, LogOut, User, ArrowLeft, ArrowRight, ShieldCheck, ImageOff, Layers, Mail, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/shared/ImageUpload";
import * as api from "@/lib/api";
import type { MembershipRole } from "@/lib/api";
import type { OnActivated } from "@/components/auth/AuthedApp";
import { basePath } from "@/auth/clerk";

const TOTAL_STEPS = 4;
const INVITE_ROLES: MembershipRole[] = ["Admin", "Mitarbeiter", "Betrachter"];

type InviteDraft = { email: string; role: MembershipRole };

export default function Onboarding({ onActivated }: { onActivated: OnActivated }) {
  const { t } = useTranslation();
  const { signOut } = useClerk();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [avatar, setAvatar] = useState("");
  // Optional first group + subsidiary (created only if a group name is given).
  const [groupName, setGroupName] = useState("");
  const [groupLogo, setGroupLogo] = useState("");
  const [subName, setSubName] = useState("");
  const [subCode, setSubCode] = useState("");
  const [subLogo, setSubLogo] = useState("");
  const [invites, setInvites] = useState<InviteDraft[]>([{ email: "", role: "Mitarbeiter" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setInvite = (i: number, patch: Partial<InviteDraft>) =>
    setInvites((list) => list.map((inv, idx) => (idx === i ? { ...inv, ...patch } : inv)));
  const addInvite = () => setInvites((list) => [...list, { email: "", role: "Mitarbeiter" }]);
  const removeInvite = (i: number) => setInvites((list) => list.filter((_, idx) => idx !== i));

  // Commits the org plus every optional artifact the user chose to fill in.
  // Anything left blank is simply skipped, so the org can start fully empty.
  const finish = async () => {
    const trimmedOrg = orgName.trim();
    if (!trimmedOrg || busy) return;
    setBusy(true);
    setError(null);
    try {
      const resp = await api.createOrg(trimmedOrg, ownerName.trim() || undefined);
      let membership = resp.membership;
      if (jobTitle.trim() || avatar) {
        membership = await api.updateProfile({ jobTitle: jobTitle.trim(), avatar });
      }

      if (groupName.trim()) {
        const groupId = `g-${Date.now()}`;
        await api.putRecord("groups", groupId, {
          id: groupId,
          name: groupName.trim(),
          logo: groupLogo || undefined,
        });
        const code = subCode.trim().toUpperCase();
        if (subName.trim() && code) {
          await api.putRecord("entities", code, {
            code,
            name: subName.trim(),
            description: "",
            location: "",
            employees: 0,
            color: "#0ea5e9",
            logo: subLogo || undefined,
            groupId,
          });
        }
      }

      for (const inv of invites) {
        const email = inv.email.trim();
        if (email) await api.createInvitation({ email, role: inv.role });
      }

      await onActivated({ ...resp, membership });
    } catch (err) {
      console.error("[onboarding] failed", err);
      setError(t("onb_error"));
      setBusy(false);
    }
  };

  const startSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setStep(2);
  };

  const stepIcon = (() => {
    if (step === 1) return <Building2 className="h-6 w-6" />;
    if (step === 2) return <User className="h-6 w-6" />;
    if (step === 3) return <Layers className="h-6 w-6" />;
    return <Mail className="h-6 w-6" />;
  })();

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="mb-6 flex items-center gap-3">
          <img src={`${basePath}/logo.svg`} alt="LPO Controlling Center" className="h-9 w-auto" />
        </div>

        <div className="mb-5 flex items-center gap-2" data-testid="onb-progress">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-teal-500" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">
          {t("onb_progress", { current: step, total: TOTAL_STEPS })}
        </p>

        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          {stepIcon}
        </div>

        {step === 1 && (
          <form onSubmit={startSetup}>
            <h1 className="text-xl font-semibold text-slate-900">{t("onb_title")}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{t("onb_subtitle")}</p>

            <div className="mt-6 space-y-1.5">
              <Label htmlFor="org-name">{t("onb_org_label")}</Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={t("onb_org_placeholder")}
                autoFocus
                data-testid="input-org-name"
              />
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-teal-50/60 p-3 text-xs text-teal-700">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {t("onb_admin_note")}
            </div>

            <Button type="submit" className="mt-6 w-full" disabled={!orgName.trim()} data-testid="button-onb-next">
              {t("onb_next")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{t("onb_wizard_profile_title")}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{t("onb_wizard_profile_subtitle")}</p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={avatar || undefined} alt={ownerName} />
                  <AvatarFallback>{(ownerName || "?").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col gap-2">
                  <Label>{t("onb_avatar_label")}</Label>
                  <ImageUpload testId="dropzone-onb-avatar" onUploaded={setAvatar} />
                  {avatar && (
                    <button type="button" onClick={() => setAvatar("")} className="inline-flex w-fit items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600" data-testid="button-onb-remove-avatar">
                      <ImageOff className="h-3.5 w-3.5" /> {t("prof_avatar_remove")}
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="owner-name">{t("onb_owner_name_label")}</Label>
                <Input id="owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder={t("onb_owner_name_placeholder")} data-testid="input-owner-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-title">{t("onb_job_title_label")}</Label>
                <Input id="job-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={t("onb_job_title_placeholder")} data-testid="input-job-title" />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={busy} data-testid="button-onb-back">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t("onb_back")}
              </Button>
              <Button type="button" className="flex-1" onClick={() => setStep(3)} disabled={busy} data-testid="button-onb-continue">
                {t("onb_continue")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{t("onb_wizard_group_title")}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{t("onb_wizard_group_subtitle")}</p>

            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="onb-group-name">{t("onb_group_name_label")}</Label>
                <Input id="onb-group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder={t("onb_group_name_placeholder")} data-testid="input-onb-group-name" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("onb_group_logo_label")}</Label>
                <div className="flex items-center gap-3">
                  {groupLogo && <img src={groupLogo} alt="" className="h-10 w-10 rounded-md object-cover ring-1 ring-slate-200" />}
                  <ImageUpload testId="dropzone-onb-group-logo" onUploaded={setGroupLogo} className="flex-1" />
                  {groupLogo && (
                    <button type="button" onClick={() => setGroupLogo("")} className="text-xs text-slate-400 hover:text-slate-600" data-testid="button-onb-remove-group-logo">
                      <ImageOff className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">{t("onb_subsidiary_section")}</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="onb-sub-name">{t("onb_sub_name_label")}</Label>
                      <Input id="onb-sub-name" value={subName} onChange={(e) => setSubName(e.target.value)} placeholder={t("onb_sub_name_placeholder")} data-testid="input-onb-sub-name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="onb-sub-code">{t("onb_sub_code_label")}</Label>
                      <Input id="onb-sub-code" value={subCode} onChange={(e) => setSubCode(e.target.value)} placeholder={t("onb_sub_code_placeholder")} data-testid="input-onb-sub-code" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {subLogo && <img src={subLogo} alt="" className="h-10 w-10 rounded-md object-cover ring-1 ring-slate-200" />}
                    <ImageUpload testId="dropzone-onb-sub-logo" hint={t("onb_sub_logo_hint")} onUploaded={setSubLogo} className="flex-1" />
                    {subLogo && (
                      <button type="button" onClick={() => setSubLogo("")} className="text-xs text-slate-400 hover:text-slate-600" data-testid="button-onb-remove-sub-logo">
                        <ImageOff className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={busy} data-testid="button-onb-back">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t("onb_back")}
              </Button>
              <Button type="button" className="flex-1" onClick={() => setStep(4)} disabled={busy} data-testid="button-onb-continue">
                {t("onb_continue")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{t("onb_wizard_invite_title")}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{t("onb_wizard_invite_subtitle")}</p>

            <div className="mt-6 space-y-3">
              {invites.map((inv, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1.5">
                    {i === 0 && <Label>{t("onb_invite_email_label")}</Label>}
                    <Input
                      type="email"
                      value={inv.email}
                      onChange={(e) => setInvite(i, { email: e.target.value })}
                      placeholder={t("onb_invite_email_placeholder")}
                      data-testid={`input-onb-invite-email-${i}`}
                    />
                  </div>
                  <div className="w-36 space-y-1.5">
                    {i === 0 && <Label>{t("onb_invite_role_label")}</Label>}
                    <Select value={inv.role} onValueChange={(v) => setInvite(i, { role: v as MembershipRole })}>
                      <SelectTrigger data-testid={`select-onb-invite-role-${i}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVITE_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{t(`role_${r.toLowerCase()}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {invites.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeInvite(i)} data-testid={`button-onb-remove-invite-${i}`}>
                      <Trash2 className="h-4 w-4 text-slate-400" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addInvite} data-testid="button-onb-add-invite">
                <Plus className="h-3.5 w-3.5" /> {t("onb_invite_add")}
              </Button>
            </div>

            {error && <p className="mt-4 text-sm text-rose-600" data-testid="text-onb-error">{error}</p>}

            <div className="mt-6 flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(3)} disabled={busy} data-testid="button-onb-back">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t("onb_back")}
              </Button>
              <Button type="button" className="flex-1" onClick={finish} disabled={busy} data-testid="button-onb-finish">
                {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("onb_creating")}</> : t("onb_finish")}
              </Button>
            </div>
          </div>
        )}

        {step > 1 && (
          <button
            type="button"
            onClick={finish}
            disabled={busy}
            className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-600 disabled:opacity-50"
            data-testid="button-onb-skip"
          >
            {t("onb_skip")}
          </button>
        )}

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
