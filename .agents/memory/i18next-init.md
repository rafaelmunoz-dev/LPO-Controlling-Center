---
name: i18next init
description: Why translation keys render raw (NO_I18NEXT_INSTANCE) and how to fix
---

The i18n config module (which calls `i18n.use(initReactI18next).init(...)`) must be
imported once at the application entry point (e.g. `main.tsx`) via a side-effect
import like `import "./i18n";`. Defining and exporting the instance is not enough —
if nothing imports the module, `init()` never executes.

**Why:** react-i18next's `useTranslation()` needs an initialized i18next instance.
Without it, the console warns `NO_I18NEXT_INSTANCE` and every `t("key")` returns the
raw key string, so the UI shows things like "search_placeholder" instead of text.

**How to apply:** When wiring i18n, add the side-effect import at the entry file
alongside `import "./index.css"`. Verify by checking the live UI shows translated
labels, not keys.
