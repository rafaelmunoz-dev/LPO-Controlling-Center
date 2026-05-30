import { useAppStore } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import { ENTITY_CODES } from "@/data";
import type { ViewKey } from "@/data/types";
import { Settings, Globe, Bell, Palette, User } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const LANGS: { code: "de" | "en" | "es"; label: string }[] = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

const ENTITY_VIEWS: ViewKey[] = ["MiGu Group Gesamt", ...ENTITY_CODES];

export default function Einstellungen() {
  const { language, setLanguage, currentUser, selectedEntity, setEntity } = useAppStore();
  const { i18n } = useTranslation();
  const [notifications, setNotifications] = useState({ approvals: true, risks: true, reports: false, sync: true });

  const changeLang = (code: "de" | "en" | "es") => {
    setLanguage(code);
    i18n.changeLanguage(code);
    toast.success(`Sprache: ${LANGS.find((l) => l.code === code)?.label}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Einstellungen" subtitle="Konto & Präferenzen" icon={<Settings className="h-5 w-5" />} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Profil</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14"><AvatarImage src={currentUser.avatar} /><AvatarFallback>{currentUser.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
              <div>
                <div className="font-semibold">{currentUser.name}</div>
                <div className="text-sm text-muted-foreground">{currentUser.email}</div>
                <Badge variant="outline" className="mt-1 bg-primary/10 text-primary border-primary/20">{currentUser.role}</Badge>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name</Label><Input defaultValue={currentUser.name} data-testid="input-profile-name" /></div>
              <div className="space-y-1.5"><Label>E-Mail</Label><Input defaultValue={currentUser.email} data-testid="input-profile-email" /></div>
              <div className="space-y-1.5"><Label>Organisation</Label><Input defaultValue={currentUser.organisation} disabled /></div>
              <div className="space-y-1.5"><Label>Rolle</Label><Input defaultValue={currentUser.role} disabled /></div>
            </div>
            <Button onClick={() => toast.success("Profil gespeichert.")} data-testid="button-save-profile">Speichern</Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Sprache & Region</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Anzeigesprache</Label>
              <div className="grid grid-cols-3 gap-2">
                {LANGS.map((l) => (
                  <Button key={l.code} variant={language === l.code ? "default" : "outline"} onClick={() => changeLang(l.code)} data-testid={`button-lang-${l.code}`}>{l.label}</Button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label>Standard-Entität</Label>
              <Select value={selectedEntity} onValueChange={(v) => { setEntity(v as typeof selectedEntity); toast.success(`Standard-Entität: ${v}`); }}>
                <SelectTrigger data-testid="select-default-entity"><SelectValue /></SelectTrigger>
                <SelectContent>{ENTITY_VIEWS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              Währung: Euro (€) · Format: Deutsch (1.234,56) · Zeitzone: MEZ
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Benachrichtigungen</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {([
              ["approvals", "Freigaben", "Bei neuen Freigabeanträgen benachrichtigen"],
              ["risks", "Risiken", "Bei kritischen Risikoänderungen warnen"],
              ["reports", "Berichte", "Bei neuen veröffentlichten Berichten"],
              ["sync", "Synchronisation", "Status der Microsoft-Adapter"],
            ] as const).map(([key, title, desc]) => (
              <div key={key} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div><div className="font-medium text-sm">{title}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
                <Switch checked={notifications[key]} onCheckedChange={(v) => { setNotifications((n) => ({ ...n, [key]: v })); toast.message(`${title}: ${v ? "aktiviert" : "deaktiviert"}`); }} data-testid={`switch-notif-${key}`} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /> Darstellung</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div><div className="font-medium text-sm">Liquid-Glass-Oberfläche</div><div className="text-xs text-muted-foreground">Transluzente Karten mit Tiefenwirkung</div></div>
              <Switch defaultChecked data-testid="switch-glass" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div><div className="font-medium text-sm">Kompakte Tabellen</div><div className="text-xs text-muted-foreground">Höhere Informationsdichte</div></div>
              <Switch data-testid="switch-compact" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Akzentfarbe</Label>
              <div className="flex gap-2">
                <div className="h-9 w-9 rounded-lg ring-2 ring-offset-2 ring-primary" style={{ background: "hsl(216 65% 11%)" }} title="Navy" />
                <div className="h-9 w-9 rounded-lg" style={{ background: "hsl(40 48% 56%)" }} title="Brass" />
              </div>
              <p className="text-xs text-muted-foreground">Navy & Brass — das Markenprofil der LPO Group.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
