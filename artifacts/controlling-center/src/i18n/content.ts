// Display-only translation for stored German free-text mock/domain content.
// Stored values stay German; tContent(value) returns the German verbatim when
// the active language is German, the EN/ES variant when a mapping exists, and
// falls back to the raw value for user-entered content not in the map.

import i18n from "./index";

interface Entry {
  en: string;
  es: string;
}

export const CONTENT: Record<string, Entry> = {
  // --- Risk titles (governance.ts RISKS) -----------------------------------
  "Lieferkettenverzögerung Asien": { en: "Supply chain delay Asia", es: "Retraso en la cadena de suministro Asia" },
  "Projektverzug Hafencity": { en: "Project delay Hafencity", es: "Retraso del proyecto Hafencity" },
  "Fachkräftemangel Montage": { en: "Skilled labor shortage assembly", es: "Escasez de personal cualificado en montaje" },
  "Wechselkursrisiko USD": { en: "Exchange rate risk USD", es: "Riesgo cambiario USD" },
  "Kampagnen-ROI unter Plan": { en: "Campaign ROI below plan", es: "ROI de campaña por debajo del plan" },
  "Maschinenausfall Linie 2": { en: "Machine failure line 2", es: "Fallo de máquina línea 2" },
  Rohstoffpreissteigerung: { en: "Raw material price increase", es: "Aumento del precio de materias primas" },
  "Abhängigkeit Einzellieferant": { en: "Single-supplier dependency", es: "Dependencia de proveedor único" },

  // --- Pre-mortems (governance.ts PREMORTEMS) ------------------------------
  "Markteintritt Österreich": { en: "Market entry Austria", es: "Entrada al mercado de Austria" },
  "Umsatzwachstum 1,2 Mio € im ersten Jahr": { en: "Revenue growth €1.2M in the first year", es: "Crecimiento de ingresos de 1,2 M€ en el primer año" },
  "Neue Region, Diversifikation des Absatzes": { en: "New region, diversification of sales", es: "Nueva región, diversificación de ventas" },
  "Vergleichbares Konsumverhalten, vorhandene Logistik nutzbar": { en: "Comparable consumer behavior, existing logistics usable", es: "Comportamiento de consumo comparable, logística existente utilizable" },
  "Regulatorische Hürden, langsamer Markenaufbau, höhere Marketingkosten": { en: "Regulatory hurdles, slow brand building, higher marketing costs", es: "Obstáculos regulatorios, construcción de marca lenta, mayores costes de marketing" },
  "Markenbekanntheit baut sich langsamer auf als geplant": { en: "Brand awareness builds more slowly than planned", es: "El reconocimiento de marca crece más lento de lo planeado" },
  "Regulatorische Zulassung verzögert sich um >6 Monate": { en: "Regulatory approval delayed by >6 months", es: "La aprobación regulatoria se retrasa más de 6 meses" },
  "Niedrige Conversion in Testkampagnen, ausbleibende Handelslistung": { en: "Low conversion in test campaigns, missing retail listings", es: "Baja conversión en campañas de prueba, ausencia de listados comerciales" },
  "Lokaler Vertriebspartner, gestaffeltes Marketingbudget, Pilot-Region": { en: "Local distribution partner, staggered marketing budget, pilot region", es: "Socio de distribución local, presupuesto de marketing escalonado, región piloto" },
  "Automatisierung Produktionslinie 2": { en: "Automation production line 2", es: "Automatización de la línea de producción 2" },
  "Stückkosten um 14% senken": { en: "Reduce unit costs by 14%", es: "Reducir los costes unitarios un 14%" },
  "Höhere Marge, geringere Fehlerquote": { en: "Higher margin, lower error rate", es: "Mayor margen, menor tasa de error" },
  "Stabile Auslastung, Personal umschulbar": { en: "Stable utilization, staff retrainable", es: "Utilización estable, personal recualificable" },
  "Integrationsprobleme, längere Stillstandzeiten, Mehrkosten": { en: "Integration problems, longer downtimes, extra costs", es: "Problemas de integración, mayores tiempos de inactividad, costes adicionales" },
  "Einführungsphase dauert länger und senkt kurzfristig Output": { en: "Rollout phase takes longer and reduces output short-term", es: "La fase de implantación dura más y reduce la producción a corto plazo" },
  "Anlage erreicht geplante Taktung nicht": { en: "Equipment does not reach the planned cycle rate", es: "El equipo no alcanza la cadencia prevista" },
  "Häufige Stopps in Testbetrieb, steigende Ausschussrate": { en: "Frequent stops in test operation, rising scrap rate", es: "Paradas frecuentes en pruebas, aumento de la tasa de desechos" },
  "Stufenweise Inbetriebnahme, Lieferantengarantie, Pufferlager": { en: "Phased commissioning, supplier warranty, buffer stock", es: "Puesta en marcha por fases, garantía del proveedor, stock de seguridad" },

  // --- Strategy decisions (governance.ts STRATEGY_DECISIONS) ---------------
  "Direktvertrieb Online IMP": { en: "Direct online sales IMP", es: "Venta directa online IMP" },
  "Margenstärkung durch Direktkanal": { en: "Margin improvement through direct channel", es: "Mejora del margen mediante canal directo" },
  "+2,5 Pp Marge": { en: "+2.5 pp margin", es: "+2,5 pp de margen" },
  "Online-Anteil 15%": { en: "Online share 15%", es: "Cuota online 15%" },
  "Online-Anteil 11%": { en: "Online share 11%", es: "Cuota online 11%" },
  "Logistik-Setup unterschätzt.": { en: "Logistics setup underestimated.", es: "Configuración logística subestimada." },
  "Premium-Linie COSM": { en: "Premium line COSM", es: "Línea premium COSM" },
  "Höherwertige Positionierung": { en: "Higher-value positioning", es: "Posicionamiento de mayor valor" },
  "+4 Pp Marge": { en: "+4 pp margin", es: "+4 pp de margen" },
  "Premium-Umsatz 3 Mio €": { en: "Premium revenue €3M", es: "Ingresos premium 3 M€" },
  "Premium-Umsatz 3,4 Mio €": { en: "Premium revenue €3.4M", es: "Ingresos premium 3,4 M€" },
  "Starke Nachfrage, Kapazität ausbauen.": { en: "Strong demand, expand capacity.", es: "Fuerte demanda, ampliar capacidad." },
  "Flottenmodernisierung CPE": { en: "Fleet modernization CPE", es: "Modernización de flota CPE" },
  "Wartungskosten senken": { en: "Reduce maintenance costs", es: "Reducir costes de mantenimiento" },
  "-12% Wartung": { en: "-12% maintenance", es: "-12% mantenimiento" },
  "Ausfallzeit -20%": { en: "Downtime -20%", es: "Tiempo de inactividad -20%" },
  "Ausfallzeit -8%": { en: "Downtime -8%", es: "Tiempo de inactividad -8%" },
  "Leasing statt Kauf prüfen.": { en: "Consider leasing instead of buying.", es: "Considerar leasing en lugar de compra." },
  "Brand Relaunch MKT": { en: "Brand relaunch MKT", es: "Relanzamiento de marca MKT" },
  "Markenwahrnehmung steigern": { en: "Increase brand perception", es: "Aumentar la percepción de marca" },
  "+18% Reichweite": { en: "+18% reach", es: "+18% alcance" },
  "Reichweite +18%": { en: "Reach +18%", es: "Alcance +18%" },
  "Reichweite +17%": { en: "Reach +17%", es: "Alcance +17%" },
  "Kanalmix funktioniert.": { en: "Channel mix works.", es: "La combinación de canales funciona." },

  // --- Purchase request titles + justifications (operations.ts) ------------
  "20x Notebook Dell Latitude": { en: "20x Dell Latitude notebooks", es: "20x portátiles Dell Latitude" },
  "Baukran Anmietung Q3": { en: "Crane rental Q3", es: "Alquiler de grúa Q3" },
  "Social Media Kampagne Sommer": { en: "Summer social media campaign", es: "Campaña de redes sociales de verano" },
  "Rohstoffe Verpackung": { en: "Packaging raw materials", es: "Materias primas de embalaje" },
  "Firmenfahrzeuge Leasing 4x": { en: "Company vehicle leasing 4x", es: "Leasing de vehículos de empresa 4x" },
  "Office 365 Lizenzen 120x": { en: "Office 365 licenses 120x", es: "Licencias Office 365 120x" },
  "Höhenverstellbare Schreibtische 30x": { en: "Height-adjustable desks 30x", es: "Escritorios de altura ajustable 30x" },
  "Wartungsvertrag CNC-Anlage": { en: "Maintenance contract CNC machine", es: "Contrato de mantenimiento máquina CNC" },
  "Ersatz für veraltete Geräte im Vertrieb.": { en: "Replacement for outdated devices in sales.", es: "Reemplazo de equipos obsoletos en ventas." },
  "Großprojekt Hafencity, 3 Monate.": { en: "Major project Hafencity, 3 months.", es: "Gran proyecto Hafencity, 3 meses." },
  "Produktlaunch neue Linie.": { en: "Product launch of new line.", es: "Lanzamiento de nueva línea." },
  "Nachbestellung Q3 Produktion.": { en: "Reorder for Q3 production.", es: "Reposición para producción Q3." },
  "Außendienst-Erweiterung.": { en: "Field sales expansion.", es: "Ampliación de ventas externas." },
  "Jahreslizenz Verlängerung.": { en: "Annual license renewal.", es: "Renovación de licencia anual." },
  "Neue Büroetage Berlin.": { en: "New office floor in Berlin.", es: "Nueva planta de oficinas en Berlín." },
  "Jahreswartung Produktionslinie 2.": { en: "Annual maintenance of production line 2.", es: "Mantenimiento anual de la línea de producción 2." },

  // --- Approvals (operations.ts) subjects / reasons / risks ----------------
  "Baukran Anmietung Q3 (PR-2042)": { en: "Crane rental Q3 (PR-2042)", es: "Alquiler de grúa Q3 (PR-2042)" },
  "Firmenfahrzeuge Leasing (PR-2045)": { en: "Company vehicle leasing (PR-2045)", es: "Leasing de vehículos de empresa (PR-2045)" },
  "12x Altgeräte Monitore": { en: "12x old monitors", es: "12x monitores antiguos" },
  "Markteintritt Österreich COSM": { en: "Market entry Austria COSM", es: "Entrada al mercado de Austria COSM" },
  "Übersteigt Genehmigungsgrenze von 50.000 €.": { en: "Exceeds the approval limit of €50,000.", es: "Supera el límite de aprobación de 50.000 €." },
  "Zusätzliche Kampagne für Produktlaunch.": { en: "Additional campaign for product launch.", es: "Campaña adicional para el lanzamiento de producto." },
  "Günstigere Rohstoffkonditionen.": { en: "Lower raw material terms.", es: "Mejores condiciones de materias primas." },
  "ROI unter Schwellenwert.": { en: "ROI below threshold.", es: "ROI por debajo del umbral." },
  "Defekt und abgeschrieben.": { en: "Defective and written off.", es: "Defectuoso y amortizado." },
  "Strategische Expansion DACH.": { en: "Strategic expansion DACH.", es: "Expansión estratégica DACH." },
  "Projektverzögerung bei Ablehnung.": { en: "Project delay if rejected.", es: "Retraso del proyecto si se rechaza." },
  "Geringere Marge im Quartal.": { en: "Lower margin in the quarter.", es: "Menor margen en el trimestre." },
  "Abhängigkeit von Einzelquelle.": { en: "Dependency on a single source.", es: "Dependencia de una fuente única." },
  "Bindung von Liquidität.": { en: "Tying up liquidity.", es: "Inmovilización de liquidez." },
  "Keine.": { en: "None.", es: "Ninguno." },
  "Markteintrittsbarrieren, Wettbewerb.": { en: "Market entry barriers, competition.", es: "Barreras de entrada al mercado, competencia." },

  // --- Upload / inventory notes (operations.ts) ----------------------------
  "Formatfehler in Spalte USt-ID.": { en: "Format error in column VAT-ID.", es: "Error de formato en la columna NIF-IVA." },
  "Display-Defekt, in Bearbeitung.": { en: "Display defect, in progress.", es: "Defecto de pantalla, en curso." },

  // --- Inventory assignees / teams (operations.ts) -------------------------
  "Bauteam Nord": { en: "Construction team North", es: "Equipo de obra Norte" },
  Außendienst: { en: "Field service", es: "Servicio externo" },
  "Produktion L2": { en: "Production L2", es: "Producción L2" },
  "Marketing Team": { en: "Marketing team", es: "Equipo de marketing" },
  "Produktion Team": { en: "Production team", es: "Equipo de producción" },

  // --- Employee job titles (operations.ts) — German ones only --------------
  Geschäftsführerin: { en: "Managing Director", es: "Directora General" },
  Werkleiter: { en: "Plant Manager", es: "Director de planta" },

  // --- Form responses (operations.ts) respondents + values -----------------
  "Team Marketing": { en: "Marketing team", es: "Equipo de marketing" },
  "Team Produktion": { en: "Production team", es: "Equipo de producción" },
  "Vertrieb IMP": { en: "Sales IMP", es: "Ventas IMP" },
  "5x Notebook": { en: "5x notebooks", es: "5x portátiles" },
  "Mai 2026": { en: "May 2026", es: "Mayo 2026" },

  // --- MS365 adapter descriptions (operations.ts) — Outlook/Planner/Excel --
  "E-Mail-Versand von Berichten und Eskalationen.": { en: "Email delivery of reports and escalations.", es: "Envío por correo de informes y escalaciones." },
  "Aufgaben aus Freigabeprozessen erstellen.": { en: "Create tasks from approval processes.", es: "Crear tareas a partir de procesos de aprobación." },
  "Berichte direkt in Excel-Vorlagen exportieren.": { en: "Export reports directly into Excel templates.", es: "Exportar informes directamente a plantillas de Excel." },

  // --- Entity descriptions (finance.ts ENTITIES seed) ----------------------
  "Import & Handel von Industriegütern": { en: "Import & trade of industrial goods", es: "Importación y comercio de bienes industriales" },
  "Bau, Montage & technische Dienstleistungen": { en: "Construction, assembly & technical services", es: "Construcción, montaje y servicios técnicos" },
  "Marketing, Werbung & Kreativdienste": { en: "Marketing, advertising & creative services", es: "Marketing, publicidad y servicios creativos" },
  "Maschinen, Anlagen & Vermietung": { en: "Machinery, equipment & rental", es: "Maquinaria, equipos y alquiler" },
  "Kosmetik & Konsumgüter": { en: "Cosmetics & consumer goods", es: "Cosmética y bienes de consumo" },
};

// Translate stored German free-text for display. German -> verbatim; EN/ES ->
// mapped variant when present; otherwise the raw value (user-entered content).
export function tContent(value: string | undefined | null): string {
  if (value == null) return "";
  const lang = (i18n.language || "de").slice(0, 2);
  if (lang === "de") return value;
  const entry = CONTENT[value];
  if (!entry) return value;
  return (lang === "es" ? entry.es : entry.en) || value;
}
