/**
 * i18n consistency check.
 *
 * Verifies that every translation key is defined in all three languages
 * (de/en/es) and reports keys that appear to be unused anywhere in the source.
 *
 * Run with:  pnpm --filter @workspace/controlling-center run i18n:check
 *
 * Exits with code 1 when a key is missing in any language so it can be wired
 * into CI; unused keys are reported as warnings and do not fail the run.
 */
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const nsDir = path.join(root, "src", "i18n", "namespaces");
const srcDir = path.join(root, "src");

type Lang = "de" | "en" | "es";
const LANGS: Lang[] = ["de", "en", "es"];

async function loadNamespaces() {
  const files = (await fs.readdir(nsDir)).filter((f) => f.endsWith(".ts"));
  const perLang: Record<Lang, Record<string, string>> = { de: {}, en: {}, es: {} };
  const keyToNs: Record<string, string> = {};
  for (const file of files.sort()) {
    const ns = file.replace(/\.ts$/, "");
    const mod = await import(pathToFileURL(path.join(nsDir, file)).href);
    for (const lang of LANGS) {
      const dict = (mod[lang] ?? {}) as Record<string, string>;
      for (const [k, v] of Object.entries(dict)) {
        perLang[lang][k] = v;
        if (lang === "de") keyToNs[k] = ns;
      }
    }
  }
  return { perLang, keyToNs };
}

async function collectSourceFiles(dir: string, acc: string[] = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === nsDir) continue; // skip the namespace definitions themselves
      await collectSourceFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

async function main() {
  const { perLang, keyToNs } = await loadNamespaces();
  const allKeys = new Set<string>();
  for (const lang of LANGS) for (const k of Object.keys(perLang[lang])) allKeys.add(k);

  // 1) Missing keys across languages.
  const missing: string[] = [];
  for (const key of [...allKeys].sort()) {
    const absent = LANGS.filter((l) => !(key in perLang[l]));
    if (absent.length) {
      missing.push(`  [${keyToNs[key] ?? "?"}] "${key}" missing in: ${absent.join(", ")}`);
    }
  }

  // 2) Unused keys (literal string not found anywhere in src).
  const files = await collectSourceFiles(srcDir);
  const haystack = (await Promise.all(files.map((f) => fs.readFile(f, "utf8")))).join("\n");
  const unused: string[] = [];
  for (const key of [...allKeys].sort()) {
    if (!haystack.includes(key)) unused.push(`  [${keyToNs[key] ?? "?"}] "${key}"`);
  }

  console.log(`i18n check: ${allKeys.size} keys across ${LANGS.join("/")}\n`);

  if (missing.length) {
    console.error(`✗ ${missing.length} key(s) missing in one or more languages:`);
    console.error(missing.join("\n"));
  } else {
    console.log("✓ All keys present in de/en/es.");
  }

  if (unused.length) {
    console.warn(`\n⚠ ${unused.length} key(s) appear unused in src (review — some may be referenced dynamically):`);
    console.warn(unused.join("\n"));
  } else {
    console.log("✓ No unused keys detected.");
  }

  process.exit(missing.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
