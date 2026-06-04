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
import { AiInsight } from "@/components/shared/AiInsight";
import { UploadPanel } from "@/components/shared/UploadPanel";
import { scopeByEntity, EMPLOYEES, INVENTORY } from "@/data";
import type { DeviceAssignment } from "@/data/types";
import { Users, CheckCircle2, Laptop, FileSignature } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const EMP_STATUS: Record<string, string> = {
  Aktiv: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Beurlaubt: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Ausgeschieden: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export default function Mitarbeiter() {
  const { t } = useTranslation();
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
        title={t("mitarbeiter_geraete")}
        subtitle={t("mit_subtitle")}
        icon={<Users className="h-5 w-5" />}
        actions={<Button onClick={() => setOpen(true)} data-testid="button-assign-device"><Laptop className="h-4 w-4 mr-1.5" /> {t("mit_assign_device")}</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{employees.length}</div><div className="text-sm text-muted-foreground mt-1">{t("mit_employees")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{employees.filter((e) => e.status === "Aktiv").length}</div><div className="text-sm text-muted-foreground mt-1">{t("mit_active")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{assignments.length}</div><div className="text-sm text-muted-foreground mt-1">{t("mit_assignments")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-amber-500">{assignments.filter((a) => !a.confirmed).length}</div><div className="text-sm text-muted-foreground mt-1">{t("mit_open_confirmations")}</div></CardContent></Card>
      </div>

      <AiInsight context="mitarbeiter" />

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees" data-testid="tab-employees">{t("mit_employees")}</TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">{t("mit_assignments")}</TabsTrigger>
          <TabsTrigger value="belege" data-testid="tab-belege">{t("tab_uploads")}</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card className="glass-card">
            <CardHeader><CardTitle>{t("mit_employees")}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>{t("name")}</TableHead><TableHead>{t("mit_position")}</TableHead><TableHead>{t("mit_department")}</TableHead><TableHead>{t("entity")}</TableHead><TableHead>{t("mit_location")}</TableHead><TableHead>{t("mit_devices")}</TableHead><TableHead>{t("status")}</TableHead></TableRow></TableHeader>
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
            <CardHeader><CardTitle>{t("mit_assignment_logs")}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>{t("mit_employee")}</TableHead><TableHead>{t("common_device")}</TableHead><TableHead>{t("common_inv_no")}</TableHead><TableHead>{t("mit_issue")}</TableHead><TableHead>{t("mit_return")}</TableHead><TableHead>{t("condition")}</TableHead><TableHead>{t("mit_confirmed")}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id} data-testid={`row-assignment-${a.id}`}>
                      <TableCell className="font-medium">{a.employee}</TableCell>
                      <TableCell>{a.device}</TableCell>
                      <TableCell className="font-mono text-xs">{a.inventoryNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{a.issueDate}</TableCell>
                      <TableCell className="text-muted-foreground">{a.returnDate ?? "—"}</TableCell>
                      <TableCell>{a.conditionReturn ?? a.conditionIssue}</TableCell>
                      <TableCell>{a.confirmed ? <span className="inline-flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle2 className="h-4 w-4" /> {t("common_yes")}</span> : <span className="inline-flex items-center gap-1 text-amber-600 text-sm"><FileSignature className="h-4 w-4" /> {t("open")}</span>}</TableCell>
                    </TableRow>
                  ))}
                  {assignments.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t("mit_empty_assignments")}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="belege">
          <UploadPanel docTypes={["Mitarbeiterliste"]} defaultDocType="Mitarbeiterliste" />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("mit_assign_device")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>{t("mit_employee")}</Label>
              <Select value={emp} onValueChange={setEmp}><SelectTrigger data-testid="select-employee"><SelectValue placeholder={t("common_select")} /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{t("mit_available_device")}</Label>
              <Select value={device} onValueChange={setDevice}><SelectTrigger data-testid="select-device"><SelectValue placeholder={t("common_select")} /></SelectTrigger>
                <SelectContent>{devices.length ? devices.map((d) => <SelectItem key={d.id} value={d.inventoryNumber}>{d.name} ({d.inventoryNumber})</SelectItem>) : <div className="px-2 py-1.5 text-sm text-muted-foreground">{t("mit_no_devices")}</div>}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{t("mit_condition_issue")}</Label><Input value={condition} onChange={(e) => setCondition(e.target.value)} data-testid="input-condition" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={assign} data-testid="button-submit-assign">{t("mit_issue_btn")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
