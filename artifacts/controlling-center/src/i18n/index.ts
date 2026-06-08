import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import * as aiCopilot from "./namespaces/aiCopilot";
import * as approvals from "./namespaces/approvals";
import * as auth from "./namespaces/auth";
import * as common from "./namespaces/common";
import * as dashboard from "./namespaces/dashboard";
import * as employees from "./namespaces/employees";
import * as entities from "./namespaces/entities";
import * as enums from "./namespaces/enums";
import * as finance from "./namespaces/finance";
import * as forecasts from "./namespaces/forecasts";
import * as inventory from "./namespaces/inventory";
import * as invite from "./namespaces/invite";
import * as landing from "./namespaces/landing";
import * as navigation from "./namespaces/navigation";
import * as onboarding from "./namespaces/onboarding";
import * as purchasing from "./namespaces/purchasing";
import * as reports from "./namespaces/reports";
import * as risks from "./namespaces/risks";
import * as settings from "./namespaces/settings";
import * as strategy from "./namespaces/strategy";
import * as team from "./namespaces/team";
import * as ui from "./namespaces/ui";
import * as uploads from "./namespaces/uploads";

// Modular translation namespaces. Keys remain globally unique, so call sites
// keep using the flat form t("key"): the default namespace is "common" and
// every other namespace is registered as a fallback (fallbackNS), which makes
// i18next search across all namespaces transparently.
const NAMESPACES = {
  common,
  navigation,
  dashboard,
  finance,
  entities,
  purchasing,
  inventory,
  employees,
  approvals,
  forecasts,
  risks,
  strategy,
  reports,
  settings,
  aiCopilot,
  uploads,
  enums,
  auth,
  landing,
  onboarding,
  invite,
  team,
  ui,
} as const;

type Lang = "de" | "en" | "es";
const LANGS: Lang[] = ["de", "en", "es"];
const nsNames = Object.keys(NAMESPACES) as (keyof typeof NAMESPACES)[];

const resources = Object.fromEntries(
  LANGS.map((lang) => [
    lang,
    Object.fromEntries(
      nsNames.map((ns) => [ns, NAMESPACES[ns][lang]]),
    ),
  ]),
) as unknown as Record<Lang, Record<string, Record<string, string>>>;

i18n.use(initReactI18next).init({
  resources,
  lng: "de",
  fallbackLng: "de",
  ns: nsNames as unknown as string[],
  defaultNS: "common",
  fallbackNS: nsNames.filter((n) => n !== "common") as unknown as string[],
  interpolation: { escapeValue: false },
});

export default i18n;
