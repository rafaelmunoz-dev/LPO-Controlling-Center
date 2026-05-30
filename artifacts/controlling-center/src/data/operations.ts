import type {
  Approval,
  DeviceAssignment,
  Employee,
  EntityCode,
  FormResponse,
  InventoryItem,
  MsAdapter,
  PurchaseRequest,
  Supplier,
  UploadItem,
} from "./types";

export const SUPPLIERS: Supplier[] = [
  { id: "S1", name: "Nordtech Industrie GmbH", category: "Maschinen", rating: 4.6, country: "Deutschland" },
  { id: "S2", name: "Pacific Components Ltd.", category: "Elektronik", rating: 4.2, country: "Taiwan" },
  { id: "S3", name: "BüroPlus AG", category: "Büroausstattung", rating: 4.0, country: "Deutschland" },
  { id: "S4", name: "CleanChem Solutions", category: "Rohstoffe", rating: 3.8, country: "Niederlande" },
  { id: "S5", name: "Adsphere Media", category: "Marketing", rating: 4.7, country: "Deutschland" },
  { id: "S6", name: "LogiFleet Mobility", category: "Fahrzeuge", rating: 4.1, country: "Deutschland" },
  { id: "S7", name: "SoftLicense24", category: "Software", rating: 4.4, country: "Irland" },
];

export const PURCHASE_REQUESTS: PurchaseRequest[] = [
  { id: "PR-2041", title: "20x Notebook Dell Latitude", supplier: "Pacific Components Ltd.", amount: 28400, entity: "IMP", category: "IT-Hardware", justification: "Ersatz für veraltete Geräte im Vertrieb.", status: "Freigegeben", requestedBy: "Daniel Weber", createdAt: "2026-05-12", document: "angebot_dell.pdf", source: "Manuell" },
  { id: "PR-2042", title: "Baukran Anmietung Q3", supplier: "Nordtech Industrie GmbH", amount: 96000, entity: "C&A", category: "Maschinen", justification: "Großprojekt Hafencity, 3 Monate.", status: "In Prüfung", requestedBy: "Sofia Martín", createdAt: "2026-05-18", source: "Manuell" },
  { id: "PR-2043", title: "Social Media Kampagne Sommer", supplier: "Adsphere Media", amount: 42000, entity: "MKT", category: "Marketing", justification: "Produktlaunch neue Linie.", status: "Eingereicht", requestedBy: "Maria Keller", createdAt: "2026-05-20", source: "Microsoft Forms" },
  { id: "PR-2044", title: "Rohstoffe Verpackung", supplier: "CleanChem Solutions", amount: 18750, entity: "COSM", category: "Rohstoffe", justification: "Nachbestellung Q3 Produktion.", status: "Bestellt", requestedBy: "Sofia Martín", createdAt: "2026-05-04", document: "po_cleanchem.pdf", source: "Manuell" },
  { id: "PR-2045", title: "Firmenfahrzeuge Leasing 4x", supplier: "LogiFleet Mobility", amount: 134000, entity: "CPE", category: "Fahrzeuge", justification: "Außendienst-Erweiterung.", status: "Abgelehnt", requestedBy: "Lucas Braun", createdAt: "2026-04-28", source: "Manuell" },
  { id: "PR-2046", title: "Office 365 Lizenzen 120x", supplier: "SoftLicense24", amount: 23900, entity: "IMP", category: "Software", justification: "Jahreslizenz Verlängerung.", status: "Bezahlt", requestedBy: "Daniel Weber", createdAt: "2026-03-30", document: "rechnung_soft.pdf", source: "Manuell" },
  { id: "PR-2047", title: "Höhenverstellbare Schreibtische 30x", supplier: "BüroPlus AG", amount: 19200, entity: "MKT", category: "Büroausstattung", justification: "Neue Büroetage Berlin.", status: "Erhalten", requestedBy: "Lucas Braun", createdAt: "2026-04-15", document: "lieferschein.pdf", source: "Manuell" },
  { id: "PR-2048", title: "Wartungsvertrag CNC-Anlage", supplier: "Nordtech Industrie GmbH", amount: 56000, entity: "CPE", category: "Wartung", justification: "Jahreswartung Produktionslinie 2.", status: "Entwurf", requestedBy: "Sofia Martín", createdAt: "2026-05-25", source: "Manuell" },
];

export const APPROVALS: Approval[] = [
  { id: "AP-501", type: "Kaufanfrage", subject: "Baukran Anmietung Q3 (PR-2042)", entity: "C&A", amount: 96000, requestedBy: "Sofia Martín", reviewedBy: "Maria Keller", date: "2026-05-19", reason: "Übersteigt Genehmigungsgrenze von 50.000 €.", documents: ["angebot_nordtech.pdf"], risks: "Projektverzögerung bei Ablehnung.", status: "In Prüfung" },
  { id: "AP-502", type: "Budgetüberschreitung", subject: "Marketing Q2 +8%", entity: "MKT", amount: 42000, requestedBy: "Maria Keller", reviewedBy: "Daniel Weber", date: "2026-05-20", reason: "Zusätzliche Kampagne für Produktlaunch.", documents: ["budget_mkt.xlsx"], risks: "Geringere Marge im Quartal.", status: "Offen" },
  { id: "AP-503", type: "Neuer Lieferant", subject: "CleanChem Solutions", entity: "COSM", requestedBy: "Sofia Martín", reviewedBy: "Maria Keller", approvedBy: "Maria Keller", date: "2026-05-02", reason: "Günstigere Rohstoffkonditionen.", documents: ["lieferanten_check.pdf"], risks: "Abhängigkeit von Einzelquelle.", status: "Freigegeben" },
  { id: "AP-504", type: "Investition", subject: "Firmenfahrzeuge Leasing (PR-2045)", entity: "CPE", amount: 134000, requestedBy: "Lucas Braun", reviewedBy: "Daniel Weber", approvedBy: "Daniel Weber", date: "2026-04-29", reason: "ROI unter Schwellenwert.", documents: ["leasing_kalkulation.xlsx"], risks: "Bindung von Liquidität.", status: "Abgelehnt" },
  { id: "AP-505", type: "Inventar-Ausmusterung", subject: "12x Altgeräte Monitore", entity: "IMP", requestedBy: "Lucas Braun", reviewedBy: "Maria Keller", date: "2026-05-21", reason: "Defekt und abgeschrieben.", documents: ["inventar_liste.pdf"], risks: "Keine.", status: "Offen" },
  { id: "AP-506", type: "Strategieentscheidung", subject: "Markteintritt Österreich COSM", entity: "COSM", amount: 320000, requestedBy: "Clara Hoffmann", reviewedBy: "Maria Keller", date: "2026-05-15", reason: "Strategische Expansion DACH.", documents: ["business_case.pdf"], risks: "Markteintrittsbarrieren, Wettbewerb.", status: "In Prüfung" },
];

export const UPLOADS: UploadItem[] = [
  { id: "U-901", fileName: "Monatsbericht_IMP_April.xlsx", docType: "Monatsbericht", entity: "IMP", period: "2026-04", format: "Excel", status: "Verarbeitet", uploadedBy: "Daniel Weber", uploadedAt: "2026-05-06", sizeKb: 482 },
  { id: "U-902", fileName: "Bankauszug_CA_Mai.pdf", docType: "Bankübersicht", entity: "C&A", period: "2026-05", format: "PDF", status: "In Prüfung", uploadedBy: "Maria Keller", uploadedAt: "2026-05-22", sizeKb: 1240 },
  { id: "U-903", fileName: "Inventur_CPE_Q1.csv", docType: "Inventurliste", entity: "CPE", period: "2026-Q1", format: "CSV", status: "Verarbeitet", uploadedBy: "Lucas Braun", uploadedAt: "2026-04-12", sizeKb: 96 },
  { id: "U-904", fileName: "Rechnungen_MKT_Mai.xlsx", docType: "Rechnungsliste", entity: "MKT", period: "2026-05", format: "Excel", status: "Neu", uploadedBy: "Sofia Martín", uploadedAt: "2026-05-28", sizeKb: 318 },
  { id: "U-905", fileName: "Budget_COSM_2026.xlsx", docType: "Budgetdatei", entity: "COSM", period: "2026", format: "Excel", status: "Verarbeitet", uploadedBy: "Maria Keller", uploadedAt: "2026-01-15", sizeKb: 524 },
  { id: "U-906", fileName: "Lieferanten_IMP.csv", docType: "Lieferantenliste", entity: "IMP", period: "2026-05", format: "CSV", status: "Fehler", uploadedBy: "Daniel Weber", uploadedAt: "2026-05-24", sizeKb: 64, note: "Formatfehler in Spalte USt-ID." },
  { id: "U-907", fileName: "Monatsbericht_COSM_April.pdf", docType: "Monatsbericht", entity: "COSM", period: "2026-04", format: "PDF", status: "Archiviert", uploadedBy: "Clara Hoffmann", uploadedAt: "2026-05-08", sizeKb: 890 },
];

const DEVICE_LOCATIONS = ["Hamburg HQ", "Lager Nord", "Büro Berlin", "München Werk", "Düsseldorf"];

function inv(
  id: string,
  num: string,
  name: string,
  category: InventoryItem["category"],
  entity: EntityCode,
  assignedTo: string,
  price: number,
  status: InventoryItem["status"],
  age: number
): InventoryItem {
  const depreciation = Math.min(0.9, age * 0.2);
  return {
    id,
    inventoryNumber: num,
    name,
    category,
    entity,
    location: DEVICE_LOCATIONS[Math.abs(num.length + entity.length) % DEVICE_LOCATIONS.length],
    assignedTo,
    condition: depreciation > 0.6 ? "Gebraucht" : "Sehr gut",
    purchaseDate: `${2026 - age}-03-14`,
    purchasePrice: price,
    currentValue: Math.round(price * (1 - depreciation)),
    depreciation: Math.round(depreciation * 100),
    warrantyUntil: `${2026 - age + 3}-03-14`,
    status,
    note: status === "in Reparatur" ? "Display-Defekt, in Bearbeitung." : undefined,
  };
}

export const INVENTORY: InventoryItem[] = [
  inv("I1", "IMP-LT-0001", "Dell Latitude 7440", "Laptop", "IMP", "Daniel Weber", 1450, "zugewiesen", 1),
  inv("I2", "IMP-MN-0014", "Dell UltraSharp 27\"", "Monitor", "IMP", "Daniel Weber", 420, "zugewiesen", 2),
  inv("I3", "IMP-PH-0033", "iPhone 15", "Handy", "IMP", "Maria Keller", 950, "zugewiesen", 1),
  inv("I4", "CA-MC-0002", "Liebherr Mobilkran", "Maschine", "C&A", "Bauteam Nord", 285000, "zugewiesen", 3),
  inv("I5", "CA-LT-0021", "Lenovo ThinkPad T14", "Laptop", "C&A", "Lucas Braun", 1320, "in Reparatur", 2),
  inv("I6", "MKT-LT-0008", "MacBook Pro 14\"", "Laptop", "MKT", "Maria Keller", 2400, "zugewiesen", 1),
  inv("I7", "MKT-TB-0003", "iPad Pro 12.9", "Tablet", "MKT", "Sofia Martín", 1300, "verfügbar", 1),
  inv("I8", "CPE-VH-0005", "VW Transporter", "Fahrzeug", "CPE", "Außendienst", 38000, "zugewiesen", 2),
  inv("I9", "CPE-MC-0011", "CNC-Fräse Haas", "Maschine", "CPE", "Produktion L2", 142000, "zugewiesen", 4),
  inv("I10", "COSM-FU-0007", "Steh-Sitz-Tisch", "Möbel", "COSM", "Clara Hoffmann", 640, "verfügbar", 1),
  inv("I11", "COSM-SW-0019", "Adobe Creative Cloud", "Software-Lizenz", "COSM", "Marketing Team", 720, "zugewiesen", 0),
  inv("I12", "IMP-MN-0040", "HP E24 Monitor", "Monitor", "IMP", "-", 240, "ausgemustert", 5),
  inv("I13", "C&A-PH-0052", "Samsung Galaxy S24", "Handy", "C&A", "Lucas Braun", 880, "zugewiesen", 0),
  inv("I14", "MKT-LT-0030", "MacBook Air M3", "Laptop", "MKT", "-", 1500, "verfügbar", 0),
  inv("I15", "CPE-TB-0014", "Surface Pro 9", "Tablet", "CPE", "-", 1200, "verloren", 1),
];

export const DEVICE_ASSIGNMENTS: DeviceAssignment[] = [
  { id: "DA-1", employee: "Daniel Weber", device: "Dell Latitude 7440", inventoryNumber: "IMP-LT-0001", issueDate: "2025-06-01", conditionIssue: "Neuwertig", confirmed: true },
  { id: "DA-2", employee: "Maria Keller", device: "MacBook Pro 14\"", inventoryNumber: "MKT-LT-0008", issueDate: "2025-09-15", conditionIssue: "Neuwertig", confirmed: true },
  { id: "DA-3", employee: "Lucas Braun", device: "Lenovo ThinkPad T14", inventoryNumber: "CA-LT-0021", issueDate: "2024-11-03", returnDate: "2026-05-20", conditionIssue: "Neuwertig", conditionReturn: "Display defekt", protocol: "protokoll_da3.pdf", confirmed: true },
  { id: "DA-4", employee: "Sofia Martín", device: "iPad Pro 12.9", inventoryNumber: "MKT-TB-0003", issueDate: "2025-12-10", conditionIssue: "Sehr gut", confirmed: false },
];

export const EMPLOYEES: Employee[] = [
  { id: "E1", name: "Daniel Weber", avatar: "/avatars/daniel.png", email: "d.weber@lpo-group.com", entity: "IMP", department: "Finanzen", position: "Finance Analyst", startDate: "2022-04-01", status: "Aktiv", location: "Hamburg", assignedDevices: ["IMP-LT-0001", "IMP-MN-0014"], openReturns: 0 },
  { id: "E2", name: "Maria Keller", avatar: "/avatars/maria.png", email: "m.keller@lpo-group.com", entity: "MKT", department: "Controlling", position: "Senior Controller", startDate: "2019-09-01", status: "Aktiv", location: "Berlin", assignedDevices: ["MKT-LT-0008", "IMP-PH-0033"], openReturns: 0 },
  { id: "E3", name: "Sofia Martín", avatar: "/avatars/sofia.png", email: "s.martin@lpo-group.com", entity: "COSM", department: "Einkauf", position: "Procurement Manager", startDate: "2021-02-15", status: "Aktiv", location: "Düsseldorf", assignedDevices: ["MKT-TB-0003"], openReturns: 1 },
  { id: "E4", name: "Lucas Braun", avatar: "/avatars/lucas.png", email: "l.braun@lpo-group.com", entity: "C&A", department: "Inventar", position: "Inventory Manager", startDate: "2020-06-10", status: "Aktiv", location: "Dortmund", assignedDevices: ["C&A-PH-0052"], openReturns: 0 },
  { id: "E5", name: "Clara Hoffmann", avatar: "/avatars/clara.png", email: "c.hoffmann@migu-group.com", entity: "COSM", department: "Management", position: "Management Reviewer", startDate: "2018-01-08", status: "Aktiv", location: "Düsseldorf", assignedDevices: ["COSM-FU-0007"], openReturns: 0 },
  { id: "E6", name: "Jonas Richter", avatar: "/avatars/maria.png", email: "j.richter@migu-group.com", entity: "CPE", department: "Produktion", position: "Werkleiter", startDate: "2017-03-20", status: "Aktiv", location: "München", assignedDevices: ["CPE-VH-0005"], openReturns: 0 },
  { id: "E7", name: "Elena Vogt", avatar: "/avatars/sofia.png", email: "e.vogt@migu-group.com", entity: "IMP", department: "Vertrieb", position: "Sales Lead", startDate: "2023-08-01", status: "Beurlaubt", location: "Hamburg", assignedDevices: [], openReturns: 0 },
];

export const FORM_RESPONSES: FormResponse[] = [
  { id: "FR-1", form: "Beschaffungsantrag", respondent: "Team Marketing", submittedAt: "2026-05-20", entity: "MKT", converted: true, fields: [{ label: "Was wird benötigt?", value: "Social Media Kampagne Sommer" }, { label: "Lieferant", value: "Adsphere Media" }, { label: "Geschätzte Kosten", value: "42.000 €" }, { label: "Begründung", value: "Produktlaunch neue Linie" }] },
  { id: "FR-2", form: "Beschaffungsantrag", respondent: "Team Produktion", submittedAt: "2026-05-26", entity: "CPE", converted: false, fields: [{ label: "Was wird benötigt?", value: "Ersatzteile CNC-Anlage" }, { label: "Lieferant", value: "Nordtech Industrie GmbH" }, { label: "Geschätzte Kosten", value: "12.500 €" }, { label: "Begründung", value: "Vorbeugende Wartung" }] },
  { id: "FR-3", form: "IT-Bedarf", respondent: "Vertrieb IMP", submittedAt: "2026-05-27", entity: "IMP", converted: false, fields: [{ label: "Gerät", value: "5x Notebook" }, { label: "Abteilung", value: "Vertrieb" }, { label: "Geschätzte Kosten", value: "7.100 €" }, { label: "Begründung", value: "Neue Mitarbeiter" }] },
  { id: "FR-4", form: "Spesenmeldung", respondent: "Clara Hoffmann", submittedAt: "2026-05-29", entity: "COSM", converted: false, fields: [{ label: "Art", value: "Messebesuch Paris" }, { label: "Betrag", value: "1.840 €" }, { label: "Zeitraum", value: "Mai 2026" }] },
];

export const MS_ADAPTERS: MsAdapter[] = [
  { service: "Microsoft Forms", description: "Formularantworten als Beschaffungsanträge importieren.", status: "Mock-Daten", lastSync: "2026-05-29 08:14" },
  { service: "SharePoint", description: "Dokumentenablage für Berichte und Verträge.", status: "Bereit", lastSync: "2026-05-28 19:02" },
  { service: "Teams", description: "Benachrichtigungen zu Freigaben und Risiken.", status: "Bereit", lastSync: "2026-05-29 07:40" },
  { service: "Outlook", description: "E-Mail-Versand von Berichten und Eskalationen.", status: "Bereit", lastSync: "2026-05-29 06:55" },
  { service: "Planner", description: "Aufgaben aus Freigabeprozessen erstellen.", status: "Nicht verbunden", lastSync: "-" },
  { service: "Excel Online", description: "Berichte direkt in Excel-Vorlagen exportieren.", status: "Mock-Daten", lastSync: "2026-05-27 16:30" },
];
