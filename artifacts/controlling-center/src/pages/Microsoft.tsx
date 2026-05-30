import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import { MS_ADAPTERS } from "@/data";
import type { MsAdapter } from "@/data/types";
import { Plug, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

type AdapterState = MsAdapter & { connected: boolean; lastSyncTime: string };

const STATUS_TONE: Record<string, string> = {
  "Bereit": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Mock-Daten": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Nicht verbunden": "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export default function Microsoft() {
  const [adapters, setAdapters] = useState<AdapterState[]>(
    MS_ADAPTERS.map((a) => ({ ...a, connected: a.status !== "Nicht verbunden", lastSyncTime: a.lastSync }))
  );

  const toggle = (service: string) => {
    setAdapters((prev) => prev.map((a) => {
      if (a.service !== service) return a;
      const connected = !a.connected;
      toast[connected ? "success" : "message"](`${a.service} ${connected ? "verbunden" : "getrennt"}.`);
      return { ...a, connected, status: connected ? "Bereit" : "Nicht verbunden" };
    }));
  };

  const sync = (service: string) => {
    const a = adapters.find((x) => x.service === service);
    if (!a?.connected) { toast.error("Adapter ist nicht verbunden."); return; }
    setAdapters((prev) => prev.map((x) => x.service === service ? { ...x, lastSyncTime: new Date().toLocaleString("de-DE") } : x));
    toast.success(`${a.service} synchronisiert.`);
  };

  const connectedCount = adapters.filter((a) => a.connected).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Microsoft Integration" subtitle="Adapter & Synchronisation" icon={<Plug className="h-5 w-5" />} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{adapters.length}</div><div className="text-sm text-muted-foreground mt-1">Adapter</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-emerald-600">{connectedCount}</div><div className="text-sm text-muted-foreground mt-1">Verbunden</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{adapters.length - connectedCount}</div><div className="text-sm text-muted-foreground mt-1">Getrennt</div></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {adapters.map((a) => (
          <Card key={a.service} className="glass-card" data-testid={`card-adapter-${a.service}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold">{a.service.slice(0, 2)}</div>
                  <div>
                    <CardTitle className="text-base">{a.service}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                  </div>
                </div>
                <Switch checked={a.connected} onCheckedChange={() => toggle(a.service)} data-testid={`switch-adapter-${a.service}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {a.connected
                  ? <Badge variant="outline" className={`gap-1 ${STATUS_TONE[a.status] ?? STATUS_TONE["Bereit"]}`}><CheckCircle2 className="h-3.5 w-3.5" /> {a.status}</Badge>
                  : <Badge variant="outline" className="gap-1 bg-slate-500/10 text-slate-600 border-slate-500/20"><XCircle className="h-3.5 w-3.5" /> Getrennt</Badge>}
              </div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Letzte Synchronisation</span><span className="font-medium">{a.lastSyncTime}</span></div>
              <Button variant="outline" size="sm" className="w-full" disabled={!a.connected} onClick={() => sync(a.service)} data-testid={`button-sync-${a.service}`}>
                <RefreshCw className="h-4 w-4 mr-1.5" /> Jetzt synchronisieren
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
