// Central display-label localization for stored German enum/domain values.
// Stored values stay German; these maps route every render through t().
// German value -> i18n key. Render with tLabel(t, value) (falls back to raw
// for user-entered content not present in the map).

type T = (k: string) => string;

// Single-token enum/domain values (categories, countries, sources, approval
// types, conditions, departments, locations, forecast kinds/units, budget &
// cost-breakdown labels, trends, months, search result types, form strings).
export const LABEL_I18N: Record<string, string> = {
  // trend
  up: "trend_up",
  down: "trend_down",
  flat: "trend_flat",
  // supplier / purchase-request categories
  Maschinen: "cat_maschinen",
  Elektronik: "cat_elektronik",
  Büroausstattung: "cat_bueroausstattung",
  Rohstoffe: "cat_rohstoffe",
  Marketing: "cat_marketing",
  Fahrzeuge: "cat_fahrzeuge",
  Software: "cat_software",
  "IT-Hardware": "cat_it_hardware",
  Wartung: "cat_wartung",
  // inventory categories
  Laptop: "icat_laptop",
  Monitor: "icat_monitor",
  Handy: "icat_handy",
  Tablet: "icat_tablet",
  Möbel: "icat_moebel",
  Maschine: "icat_maschine",
  Fahrzeug: "icat_fahrzeug",
  "Software-Lizenz": "icat_software_lizenz",
  Sonstiges: "icat_sonstiges",
  // countries
  Deutschland: "country_de",
  Taiwan: "country_tw",
  Niederlande: "country_nl",
  Irland: "country_ie",
  // purchase-request source
  Manuell: "src_manuell",
  "Microsoft Forms": "src_ms_forms",
  // approval types
  Kaufanfrage: "apt_kaufanfrage",
  Rechnung: "apt_rechnung",
  Budgetüberschreitung: "apt_budgetueberschreitung",
  "Neuer Lieferant": "apt_neuer_lieferant",
  "Inventar-Ausmusterung": "apt_inventar_ausmusterung",
  Investition: "apt_investition",
  Strategieentscheidung: "apt_strategieentscheidung",
  // inventory / device conditions
  "Sehr gut": "cond_sehr_gut",
  Gebraucht: "cond_gebraucht",
  Neuwertig: "cond_neuwertig",
  "Display defekt": "cond_display_defekt",
  // employee departments
  Finanzen: "dep_finanzen",
  Controlling: "dep_controlling",
  Einkauf: "dep_einkauf",
  Inventar: "dep_inventar",
  Management: "dep_management",
  Produktion: "dep_produktion",
  Vertrieb: "dep_vertrieb",
  // device locations
  "Hamburg HQ": "loc_hamburg_hq",
  "Lager Nord": "loc_lager_nord",
  "Büro Berlin": "loc_buero_berlin",
  "München Werk": "loc_muenchen_werk",
  Düsseldorf: "loc_duesseldorf",
  // forecast kinds + unit
  Umsatz: "fc_umsatz",
  Kosten: "fc_kosten",
  Liquidität: "fc_liquiditaet",
  Personalbedarf: "fc_personalbedarf",
  Inventarbedarf: "fc_inventarbedarf",
  Investitionen: "fc_investitionen",
  Stück: "fcu_stueck",
  // budget categories
  Umsatzerlöse: "bcat_umsatzerloese",
  Warenkosten: "bcat_warenkosten",
  Personalkosten: "bcat_personalkosten",
  "IT & Software": "bcat_it_software",
  "Sonstige Op. Kosten": "bcat_sonstige_op",
  // cost-breakdown names
  Personal: "cb_personal",
  Betriebskosten: "cb_betriebskosten",
  Abschreibungen: "cb_abschreibungen",
  "Zinsen & Steuern": "cb_zinsen_steuern",
  // months (chart axes)
  Jan: "mon_jan",
  Feb: "mon_feb",
  Mär: "mon_mar",
  Apr: "mon_apr",
  Mai: "mon_mai",
  Jun: "mon_jun",
  Jul: "mon_jul",
  Aug: "mon_aug",
  Sep: "mon_sep",
  Okt: "mon_okt",
  Nov: "mon_nov",
  Dez: "mon_dez",
  // search result types
  Modul: "srt_modul",
  Lieferant: "supplier",
  Mitarbeiter: "srt_mitarbeiter",
  Risiko: "srt_risiko",
  Strategie: "strategie",
  Entität: "srt_entitaet",
  Report: "srt_report",
  // form-response form names, field labels & German content values
  Beschaffungsantrag: "form_beschaffungsantrag",
  "IT-Bedarf": "form_it_bedarf",
  Spesenmeldung: "form_spesenmeldung",
  "Was wird benötigt?": "form_q_what",
  "Geschätzte Kosten": "form_q_cost",
  Abteilung: "form_q_department",
  Art: "form_q_type",
  "Social Media Kampagne Sommer": "form_v_smc",
  "Produktlaunch neue Linie": "form_v_launch",
  "Ersatzteile CNC-Anlage": "form_v_cnc",
  "Vorbeugende Wartung": "form_v_maint",
  "Neue Mitarbeiter": "form_v_newemp",
  "Messebesuch Paris": "form_v_paris",
  // reused existing keys for identical German strings
  Begründung: "common_justification",
  Gerät: "common_device",
  Betrag: "amount",
  Zeitraum: "period",
};

// P&L row labels (finance.ts getProfitLoss) -> key.
export const PL_LABEL_I18N: Record<string, string> = {
  Umsatzerlöse: "plr_umsatzerloese",
  "Warenkosten (COGS)": "plr_warenkosten_cogs",
  Bruttogewinn: "plr_bruttogewinn",
  Personalkosten: "plr_personalkosten",
  "Sonstige betriebliche Kosten": "plr_sonstige_betrieb",
  "Operativer Gewinn (EBITDA)": "plr_ebitda",
  Abschreibungen: "plr_abschreibungen",
  EBIT: "plr_ebit",
  Zinsaufwand: "plr_zinsaufwand",
  Steuern: "plr_steuern",
  Nettoergebnis: "plr_nettoergebnis",
};

// Balance-sheet line labels (finance.ts getBalanceSheet) -> key.
export const BAL_LABEL_I18N: Record<string, string> = {
  Anlagevermögen: "bal_anlagevermoegen",
  Vorräte: "bal_vorraete",
  Forderungen: "bal_forderungen",
  "Liquide Mittel": "bal_liquide_mittel",
  Eigenkapital: "bal_eigenkapital",
  "Langfristige Schulden": "bal_langfr_schulden",
  "Kurzfristige Schulden": "bal_kurzfr_schulden",
  "Verbindlichkeiten L&L": "bal_verbindlichkeiten_ll",
};

// P&L + balance explain tooltips (German source text) -> key.
export const EXPLAIN_I18N: Record<string, string> = {
  // P&L
  "Gesamte Einnahmen aus Verkäufen und Leistungen.": "plx_umsatzerloese",
  "Direkte Kosten der verkauften Produkte und Leistungen.": "plx_warenkosten",
  "Umsatz minus direkte Warenkosten.": "plx_bruttogewinn",
  "Löhne, Gehälter und Sozialabgaben.": "plx_personalkosten",
  "Miete, Marketing, IT und weitere laufende Kosten.": "plx_sonstige_betrieb",
  "Ergebnis vor Zinsen, Steuern und Abschreibungen.": "plx_ebitda",
  "Wertverlust von Anlagen und Maschinen über die Zeit.": "plx_abschreibungen",
  "Operatives Ergebnis vor Zinsen und Steuern.": "plx_ebit",
  "Kosten für Kredite und Finanzierungen.": "plx_zinsaufwand",
  "Ertragssteuern auf den Gewinn.": "plx_steuern",
  "Verbleibender Gewinn nach allen Kosten und Steuern.": "plx_nettoergebnis",
  // balance
  "Langfristige Vermögenswerte wie Maschinen und Gebäude.": "balx_anlagevermoegen",
  "Lagerbestände an Waren und Materialien.": "balx_vorraete",
  "Offene Rechnungen von Kunden.": "balx_forderungen",
  "Verfügbares Bargeld und Bankguthaben.": "balx_liquide_mittel",
  "Vermögen der Eigentümer im Unternehmen.": "balx_eigenkapital",
  "Kredite mit Laufzeit über einem Jahr.": "balx_langfr_schulden",
  "Verbindlichkeiten innerhalb eines Jahres.": "balx_kurzfr_schulden",
  "Offene Rechnungen an Lieferanten.": "balx_verbindlichkeiten_ll",
};

function lookup(map: Record<string, string>, t: T, value: string): string {
  const key = map[value];
  return key ? t(key) : value;
}

// Universal enum/domain label localizer (falls back to raw user content).
export function tLabel(t: T, value: string | undefined | null): string {
  if (value == null) return "";
  return lookup(LABEL_I18N, t, value);
}

export function tPlLabel(t: T, value: string): string {
  return lookup(PL_LABEL_I18N, t, value);
}

export function tBalLabel(t: T, value: string): string {
  return lookup(BAL_LABEL_I18N, t, value);
}

// P&L / balance labels share one rendering surface (BalanceLineItem.label and
// PLRow.label); this tries both label maps.
export function tFinanceLabel(t: T, value: string): string {
  return PL_LABEL_I18N[value]
    ? t(PL_LABEL_I18N[value])
    : BAL_LABEL_I18N[value]
      ? t(BAL_LABEL_I18N[value])
      : value;
}

export function tExplain(t: T, value: string | undefined): string {
  if (value == null) return "";
  return lookup(EXPLAIN_I18N, t, value);
}

// Bank-transaction suggestion reasons are generated at runtime in German (one
// with an interpolated vendor label). Map them back to localized strings at the
// render layer without touching the data/logic layer.
export function tSuggestionReason(
  t: (k: string, opts?: Record<string, unknown>) => string,
  reason: string | undefined | null,
): string {
  if (!reason) return "";
  if (reason === "Aus Stichwörtern im Verwendungszweck abgeleitet.") {
    return t("beleg_reason_heuristic");
  }
  const m = /^Aus früherer Buchung von „(.+)“ gelernt\.$/.exec(reason);
  if (m) return t("beleg_reason_learned", { label: m[1] });
  return reason;
}
