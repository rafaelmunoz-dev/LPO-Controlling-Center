import { useAppStore, USERS } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import { ROLE_DEFS, ROLE_PERMISSIONS, NAV_KEYS } from "@/data/governance";
import { Shield, CheckCircle2, UserCheck } from "lucide-react";
import { toast } from "sonner";

const NAV_LABELS: Record<string, string> = {
  dashboard: "Dashboard", finanzen: "Finanzen", upload: "Upload Center", einkauf: "Einkauf", inventar: "Inventar",
  mitarbeiter: "Mitarbeiter", freigaben: "Freigaben", prognosen: "Prognosen", risiko: "Risiko", strategie: "Strategie",
  entitaeten: "Entitäten", reports: "Reports", microsoft: "Microsoft", benutzer: "Benutzer", einstellungen: "Einstellungen",
};

export default function Benutzer() {
  const { currentUser, setCurrentUser } = useAppStore();

  return (
    <div className="space-y-6">
      <PageHeader title="Benutzer & Rollen" subtitle="Zugriffsverwaltung" icon={<Shield className="h-5 w-5" />} />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">Benutzer</TabsTrigger>
          <TabsTrigger value="roles" data-testid="tab-roles">Rollen</TabsTrigger>
          <TabsTrigger value="matrix" data-testid="tab-matrix">Rechtematrix</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="glass-card">
            <CardHeader><CardTitle>Benutzer</CardTitle><p className="text-sm text-muted-foreground">Aktive Sitzung wechseln, um Rollenrechte zu testen.</p></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Benutzer</TableHead><TableHead>Rolle</TableHead><TableHead>Organisation</TableHead><TableHead>Entitätszugriff</TableHead><TableHead>Letzte Aktivität</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader>
                <TableBody>
                  {USERS.map((u) => (
                    <TableRow key={u.id} data-testid={`row-user-${u.id}`} className={u.id === currentUser.id ? "bg-primary/5" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8"><AvatarImage src={u.avatar} /><AvatarFallback>{u.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                          <div><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{u.role}</Badge></TableCell>
                      <TableCell>{u.organisation}</TableCell>
                      <TableCell className="text-muted-foreground">{u.entityAccess.length} Entitäten</TableCell>
                      <TableCell className="text-muted-foreground">{u.lastActivity}</TableCell>
                      <TableCell className="text-right">
                        {u.id === currentUser.id
                          ? <span className="inline-flex items-center gap-1 text-emerald-600 text-sm"><UserCheck className="h-4 w-4" /> Aktiv</span>
                          : <Button size="sm" variant="outline" onClick={() => { setCurrentUser(u); toast.success(`Angemeldet als ${u.name} (${u.role}).`); }} data-testid={`button-switch-${u.id}`}>Wechseln</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid gap-4 md:grid-cols-2">
            {ROLE_DEFS.map((r) => (
              <Card key={r.role} className="glass-card" data-testid={`card-role-${r.role}`}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    {r.role}
                    <Badge variant="outline">{ROLE_PERMISSIONS[r.role].length} Module</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {r.permissions.map((p) => <Badge key={p} variant="outline" className="gap-1 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> {p}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <Card className="glass-card">
            <CardHeader><CardTitle>Rechtematrix</CardTitle><p className="text-sm text-muted-foreground">Modulzugriff je Rolle.</p></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card">Modul</TableHead>
                    {ROLE_DEFS.map((r) => <TableHead key={r.role} className="text-center whitespace-nowrap text-xs">{r.role}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {NAV_KEYS.map((nav) => (
                    <TableRow key={nav} data-testid={`matrix-row-${nav}`}>
                      <TableCell className="font-medium sticky left-0 bg-card">{NAV_LABELS[nav]}</TableCell>
                      {ROLE_DEFS.map((r) => (
                        <TableCell key={r.role} className="text-center">
                          {ROLE_PERMISSIONS[r.role].includes(nav)
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                            : <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
