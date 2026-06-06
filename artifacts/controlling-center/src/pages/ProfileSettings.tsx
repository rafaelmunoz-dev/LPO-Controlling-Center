import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useClerk } from "@clerk/react";
import { User, Globe, Loader2, ImageOff, KeyRound, Mail } from "lucide-react";
import { useAppStore } from "@/hooks/use-app-context";
import { PageHeader } from "@/components/shared/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { AdminBadge } from "@/components/shared/AdminBadge";
import { isAdmin } from "@/data/governance";
import * as api from "@/lib/api";
import { toast } from "sonner";

const LANGS: { code: "de" | "en" | "es"; label: string; flag: string }[] = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function ProfileSettings() {
  const { t, i18n } = useTranslation();
  const { openUserProfile } = useClerk();
  const { currentUser, setCurrentUser, language, setLanguage } = useAppStore();

  const [name, setName] = useState(currentUser.name);
  const [jobTitle, setJobTitle] = useState(currentUser.jobTitle);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [saving, setSaving] = useState(false);

  const dirty =
    name.trim() !== currentUser.name ||
    jobTitle !== currentUser.jobTitle ||
    avatar !== currentUser.avatar;

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name: trimmed, jobTitle, avatar });
      setCurrentUser({
        ...currentUser,
        name: updated.name || trimmed,
        jobTitle: updated.jobTitle ?? jobTitle,
        avatar: updated.avatar ?? avatar,
      });
      toast.success(t("prof_saved"));
    } catch (err) {
      console.error("[profile] save failed", err);
      toast.error(t("prof_save_error"));
    } finally {
      setSaving(false);
    }
  };

  const changeLang = (code: "de" | "en" | "es") => {
    setLanguage(code);
    i18n.changeLanguage(code);
    setCurrentUser({ ...currentUser, language: code });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("prof_title")} subtitle={t("prof_subtitle")} icon={<User className="h-5 w-5" />} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> {t("prof_personal")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatar || undefined} alt={name} />
                <AvatarFallback className="text-lg">{initials(name || currentUser.email)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-2">
                <Label>{t("prof_avatar")}</Label>
                <ImageUpload testId="dropzone-avatar" hint={t("prof_avatar_hint")} onUploaded={setAvatar} />
                {avatar && (
                  <Button size="sm" variant="ghost" className="w-fit gap-1.5 text-muted-foreground" onClick={() => setAvatar("")} data-testid="button-remove-avatar">
                    <ImageOff className="h-3.5 w-3.5" /> {t("prof_avatar_remove")}
                  </Button>
                )}
              </div>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">{t("prof_full_name")}</Label>
              <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-profile-name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-job">{t("prof_job_title")}</Label>
              <Input id="profile-job" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={t("prof_job_title_placeholder")} data-testid="input-profile-job" />
            </div>
            <Button onClick={save} disabled={!name.trim() || !dirty || saving} data-testid="button-save-profile">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("onb_creating")}</> : t("save")}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> {t("prof_language")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {LANGS.map((l) => (
                  <Button
                    key={l.code}
                    variant={language === l.code ? "default" : "outline"}
                    className="gap-2"
                    onClick={() => changeLang(l.code)}
                    data-testid={`button-lang-${l.code}`}
                  >
                    <span className="text-base leading-none">{l.flag}</span>
                    {l.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t("prof_language_hint")}</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">{t("prof_account")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("set_email")}</span>
                <span className="font-medium">{currentUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("set_organisation")}</span>
                <span className="font-medium">{currentUser.organisation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("set_role")}</span>
                <span className="flex items-center gap-2 font-medium">
                  {t(`role_${currentUser.role.toLowerCase()}`)}
                  {isAdmin(currentUser.role) && <AdminBadge />}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t("prof_role_readonly")}</p>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("prof_security_hint")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openUserProfile()} data-testid="button-change-email">
                    <Mail className="h-3.5 w-3.5" /> {t("prof_change_email")}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openUserProfile()} data-testid="button-change-password">
                    <KeyRound className="h-3.5 w-3.5" /> {t("prof_change_password")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
