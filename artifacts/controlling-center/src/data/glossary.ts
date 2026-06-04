export type GlossaryKey =
  | "umsatz"
  | "ebitda"
  | "ebitda_marge"
  | "nettoergebnis"
  | "bruttogewinn"
  | "ebit"
  | "cashflow"
  | "liquiditaet"
  | "cash_runway"
  | "budget_ist"
  | "konsolidierung"
  | "intercompany"
  | "pre_mortem"
  | "abschreibung"
  | "offene_rechnungen"
  | "forderungen"
  | "eigenkapital"
  | "inventur"
  | "depreciation";

type Entry = { term: string; text: string };

export const GLOSSARY: Record<GlossaryKey, { de: Entry; en: Entry; es: Entry }> = {
  umsatz: {
    de: { term: "Umsatz", text: "Alle Einnahmen aus Verkäufen und Leistungen in einem Zeitraum – bevor Kosten abgezogen werden." },
    en: { term: "Revenue", text: "All income from sales and services in a period – before any costs are deducted." },
    es: { term: "Ingresos", text: "Todos los ingresos por ventas y servicios en un período, antes de deducir costes." },
  },
  ebitda: {
    de: { term: "EBITDA", text: "Operativer Gewinn vor Zinsen, Steuern und Abschreibungen. Zeigt, wie profitabel das Kerngeschäft arbeitet." },
    en: { term: "EBITDA", text: "Operating profit before interest, taxes and depreciation. Shows how profitable the core business is." },
    es: { term: "EBITDA", text: "Beneficio operativo antes de intereses, impuestos y amortizaciones. Mide la rentabilidad del negocio base." },
  },
  ebitda_marge: {
    de: { term: "EBITDA-Marge", text: "EBITDA geteilt durch Umsatz. Je höher, desto mehr Gewinn bleibt aus jedem Euro Umsatz übrig." },
    en: { term: "EBITDA margin", text: "EBITDA divided by revenue. The higher it is, the more profit remains from each euro of revenue." },
    es: { term: "Margen EBITDA", text: "EBITDA dividido entre ingresos. Cuanto mayor, más beneficio queda de cada euro de ingreso." },
  },
  nettoergebnis: {
    de: { term: "Nettoergebnis", text: "Der Gewinn, der nach allen Kosten, Zinsen und Steuern übrig bleibt – die «Bottom Line»." },
    en: { term: "Net profit", text: "The profit that remains after all costs, interest and taxes – the bottom line." },
    es: { term: "Beneficio neto", text: "El beneficio que queda tras todos los costes, intereses e impuestos – el resultado final." },
  },
  bruttogewinn: {
    de: { term: "Bruttogewinn", text: "Umsatz minus direkte Warenkosten. Zeigt die Marge vor Personal- und Betriebskosten." },
    en: { term: "Gross profit", text: "Revenue minus direct cost of goods. Shows the margin before staff and operating costs." },
    es: { term: "Beneficio bruto", text: "Ingresos menos coste directo de productos. Margen antes de personal y gastos operativos." },
  },
  ebit: {
    de: { term: "EBIT", text: "Operatives Ergebnis vor Zinsen und Steuern – also nach Abschreibungen, aber vor Finanzierung." },
    en: { term: "EBIT", text: "Operating result before interest and taxes – after depreciation, but before financing." },
    es: { term: "EBIT", text: "Resultado operativo antes de intereses e impuestos, tras amortizaciones." },
  },
  cashflow: {
    de: { term: "Cashflow", text: "Tatsächlicher Geldfluss in und aus dem Unternehmen. Anders als der Gewinn zeigt er, was wirklich auf dem Konto landet." },
    en: { term: "Cash flow", text: "The actual movement of money in and out of the business. Unlike profit, it shows what really hits the bank." },
    es: { term: "Flujo de caja", text: "El movimiento real de dinero que entra y sale. A diferencia del beneficio, muestra lo que llega al banco." },
  },
  liquiditaet: {
    de: { term: "Liquidität", text: "Verfügbares Geld auf Konten und in Kasse, mit dem Rechnungen sofort bezahlt werden können." },
    en: { term: "Liquidity", text: "Cash available in accounts and on hand to pay bills immediately." },
    es: { term: "Liquidez", text: "Dinero disponible en cuentas y caja para pagar facturas de inmediato." },
  },
  cash_runway: {
    de: { term: "Cash Runway", text: "Wie viele Monate das Unternehmen mit dem aktuellen Geld auskommt, wenn sonst nichts hereinkommt." },
    en: { term: "Cash runway", text: "How many months the company can operate on its current cash if nothing else comes in." },
    es: { term: "Autonomía de caja", text: "Cuántos meses puede operar la empresa con su efectivo actual sin nuevos ingresos." },
  },
  budget_ist: {
    de: { term: "Budget vs. Ist", text: "Vergleich von geplanten (Budget) und tatsächlichen (Ist) Werten – zeigt, wo der Plan eingehalten wurde." },
    en: { term: "Budget vs. actual", text: "Comparison of planned (budget) and real (actual) figures – shows where the plan held up." },
    es: { term: "Presupuesto vs. real", text: "Comparación entre lo planificado y lo real – muestra dónde se cumplió el plan." },
  },
  konsolidierung: {
    de: { term: "Konsolidierung", text: "Zusammenfassen aller Tochtergesellschaften zu einer Konzernsicht, bereinigt um interne Geschäfte." },
    en: { term: "Consolidation", text: "Combining all subsidiaries into one group view, adjusted for internal transactions." },
    es: { term: "Consolidación", text: "Combinar todas las filiales en una vista de grupo, ajustando las operaciones internas." },
  },
  intercompany: {
    de: { term: "Intercompany", text: "Geschäfte zwischen Schwestergesellschaften. Sie werden im Konzernabschluss herausgerechnet." },
    en: { term: "Intercompany", text: "Transactions between sister companies. They are eliminated in the group accounts." },
    es: { term: "Intercompañía", text: "Operaciones entre empresas hermanas. Se eliminan en las cuentas de grupo." },
  },
  pre_mortem: {
    de: { term: "Pre-Mortem", text: "Methode, bei der man vorab annimmt, ein Projekt sei gescheitert, um Risiken früh zu erkennen." },
    en: { term: "Pre-mortem", text: "A method where you imagine upfront that a project failed, to spot risks early." },
    es: { term: "Pre-mortem", text: "Método donde se imagina de antemano que un proyecto fracasó, para detectar riesgos pronto." },
  },
  abschreibung: {
    de: { term: "Abschreibung", text: "Der planmäßige Wertverlust von Anlagen und Maschinen, verteilt über ihre Nutzungsdauer." },
    en: { term: "Depreciation", text: "The planned loss in value of assets and machines, spread over their useful life." },
    es: { term: "Amortización", text: "La pérdida de valor planificada de activos y máquinas a lo largo de su vida útil." },
  },
  offene_rechnungen: {
    de: { term: "Offene Rechnungen", text: "Bereits gestellte Kundenrechnungen, die noch nicht bezahlt wurden." },
    en: { term: "Open invoices", text: "Customer invoices that have been issued but not yet paid." },
    es: { term: "Facturas abiertas", text: "Facturas a clientes ya emitidas pero aún no pagadas." },
  },
  forderungen: {
    de: { term: "Forderungen", text: "Geld, das Kunden dem Unternehmen noch schulden." },
    en: { term: "Receivables", text: "Money that customers still owe the company." },
    es: { term: "Cuentas por cobrar", text: "Dinero que los clientes aún deben a la empresa." },
  },
  eigenkapital: {
    de: { term: "Eigenkapital", text: "Der Teil des Vermögens, der den Eigentümern gehört – Vermögen minus Schulden." },
    en: { term: "Equity", text: "The part of assets owned by the shareholders – assets minus liabilities." },
    es: { term: "Patrimonio", text: "La parte de los activos que pertenece a los propietarios – activos menos deudas." },
  },
  inventur: {
    de: { term: "Inventur", text: "Die körperliche Zählung aller Bestände, um Buchwerte mit der Realität abzugleichen." },
    en: { term: "Stocktaking", text: "The physical count of all assets to reconcile book values with reality." },
    es: { term: "Inventario físico", text: "El recuento físico de los bienes para conciliar los valores contables con la realidad." },
  },
  depreciation: {
    de: { term: "Wertminderung", text: "Wie viel ein Gerät seit dem Kauf an Wert verloren hat, in Prozent." },
    en: { term: "Depreciation", text: "How much a device has lost in value since purchase, as a percentage." },
    es: { term: "Depreciación", text: "Cuánto valor ha perdido un dispositivo desde su compra, en porcentaje." },
  },
};
