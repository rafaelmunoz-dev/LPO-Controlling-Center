import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import { scopeByEntity, EMPLOYEES, INVENTORY } from "@/data";
import type { DeviceAssignment } from "@/data/types";
import { Users, CheckCircle2, Laptop, FileSignature } from "lucide-react";
import { toast } from "sonner";

const EMP_STATUS: Record<string, string> = {
  Aktiv: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Beurlaubt: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Ausgeschieden: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export default function Mitarbeiter() {
  const { selectedEntity, deviceAssignments, addDeviceAssignment } = useAppStore();
  const employees = scopeByEntity(EMPLOYEES, selectedEntity);
  const empNames = employees.map((e) => e.name);
  const assignments = deviceAssignments.filter((a) => selectedEntity === "MiGu Group Gesamt" || empNames.includes(a.employee));
  const devices = scopeByEntity(INVENTORY, selectedEntity).filter((i) => i.status === "verfügbar");

  const [open, setOpen] = useState(false);
  const [emp, setEmp] = useState(employees[0]?.name ?? "");
  const [device, setDevice] = useState(devices[0]?.inventoryNumber ?? "");
  const [condition, setCondition] = useState("Neuwertig");

  const assign = () => {
    const dev = INVENTORY.find((i) => i.inventoryNumber === device);
    if (!emp || !dev) { toast.error("Bitte Mitarbeiter und Gerät wählen."); return; }
    const da: DeviceAssignment = {
      id: `DA-${Math.floor(Math.random() * 9000 + 1000)}`,
      employee: emp,
      device: dev.name,
      inventoryNumber: dev.inventoryNumber,
      issueDate: new Date().toISOString().slice(0, 10),
      conditionIssue: condition,
      confirmed: false,
    };
    addDeviceAssignment(da);
    toast.success(`${dev.name} an ${emp} ausgegeben.`);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mitarbeiter & Geräte"
        subtitle="Personal & Geräteausgabe"
        icon={<Users className="h-5 w-5" />}
        actions={<Button onClick={() => setOpen(true)} data-testid="button-assign-device"><Laptop className="h-4 w-4 mr-1.5" /> Gerät ausgeben</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{employees.length}</div><div className="text-sm text-muted-foreground mt-1">Mitarbeiter</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{employees.filter((e) => e.status === "Aktiv").length}</div><div className="text-sm text-muted-foreground mt-1">Aktiv</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{assignments.length}</div><div className="text-sm text-muted-foreground mt-1">Geräteausgaben</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-amber-500">{assignments.filter((a) => !a.confirmed).length}</div><div className="text-sm text-muted-foreground mt-1">Offene Bestätigungen</div></CardContent></Card>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees" data-testid="tab-employees">Mitarbeiter</TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">Geräteausgaben</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card className="glass-card">
            <CardHeader><CardTitle>Mitarbeiter</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Position</TableHead><TableHead>Abteilung</TableHead><TableHead>Entität</TableHead><TableHead>Standort</TableHead><TableHead>Geräte</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.id} data-testid={`row-employee-${e.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8"><AvatarImage src={e.avatar} /><AvatarFallback>{e.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                          <div><div className="font-medium">{e.name}</div><div className="text-xs text-muted-foreground">{e.email}</div></div>
                        </div>
                      </TableCell>
                      <TableCell>{e.position}</TableCell>
                      <TableCell>{e.department}</TableCell>
                      <TableCell>{e.entity}</TableCell>
                      <TableCell className="text-muted-foreground">{e.location}</TableCell>
                      <TableCell>{e.assignedDevices.length}</TableCell>
                      <TableCell><Badge variant="outline" className={EMP_STATUS[e.status]}>{e.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card className="glass-card">
            <CardHeader><CardTitle>Geräteausgabe-Protokolle</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Mitarbeiter</TableHead><TableHead>Gerät</TableHead><TableHead>Inv-Nr.</TableHead><TableHead>Ausgabe</TableHead><TableHead>Rückgabe</TableHead><TableHead>Zustand</TableHead><TableHead>Bestätigt</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id} data-testid={`row-assignment-${a.id}`}>
                      <TableCell className="font-medium">{a.employee}</TableCell>
                      <TableCell>{a.device}</TableCell>
                      <TableCell className="font-mono text-xs">{a.inventoryNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{a.issueDate}</TableCell>
                      <TableCell className="text-muted-foreground">{a.returnDate ?? "—"}</TableCell>
                      <TableCell>{a.conditionReturn ?? a.conditionIssue}</TableCell>
                      <TableCell>{a.confirmed ? <span className="inline-flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle2 className="h-4 w-4" /> Ja</span> : <span className="inline-flex items-center gap-1 text-amber-600 text-sm"><FileSignature className="h-4 w-4" /> Offen</span>}</TableCell>
                    </TableRow>
                  ))}
                  {assignments.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Keine Geräteausgaben.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gerät ausgeben</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Mitarbeiter</Label>
              <Select value={emp} onValueChange={setEmp}><SelectTrigger data-testid="select-employee"><SelectValue placeholder="Wählen" /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Verfügbares Gerät</Label>
              <Select value={device} onValueChange={setDevice}><SelectTrigger data-testid="select-device"><SelectValue placeholder="Wählen" /></SelectTrigger>
                <SelectContent>{devices.length ? devices.map((d) => <SelectItem key={d.id} value={d.inventoryNumber}>{d.name} ({d.inventoryNumber})</SelectItem>) : <div className="px-2 py-1.5 text-sm text-muted-foreground">Keine verfügbaren Geräte</div>}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Zustand bei Ausgabe</Label><Input value={condition} onChange={(e) => setCondition(e.target.value)} data-testid="input-condition" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={assign} data-testid="button-submit-assign">Ausgeben</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
