import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDirectory = join(process.cwd(), ".output");
const publicSupabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
const publicSupabaseKey = (
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  ""
).trim();

function requirePublicConfiguration() {
  let parsedUrl;
  try {
    parsedUrl = new URL(publicSupabaseUrl);
  } catch {
    throw new Error("VITE_SUPABASE_URL or SUPABASE_URL must be a valid HTTPS URL.");
  }
  if (parsedUrl.protocol !== "https:") {
    throw new Error("The public Supabase URL must use HTTPS.");
  }
  if (publicSupabaseKey.length < 40) {
    throw new Error(
      "VITE_SUPABASE_PUBLISHABLE_KEY or SUPABASE_PUBLISHABLE_KEY is missing or invalid.",
    );
  }
}

async function outputFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return outputFiles(path);
      return /\.(?:html|js|mjs)$/i.test(entry.name) ? [path] : [];
    }),
  );
  return nested.flat();
}

async function injectPublicEnvironment() {
  requirePublicConfiguration();
  const replacements = [
    ["https://runtime-supabase-config.invalid", publicSupabaseUrl],
    ["__AGHANIMS_SUPABASE_PUBLISHABLE_KEY__", publicSupabaseKey],
  ];
  let changedFiles = 0;

  for (const path of await outputFiles(outputDirectory)) {
    const original = await readFile(path, "utf8");
    let updated = original;
    for (const [marker, value] of replacements) updated = updated.replaceAll(marker, value);
    if (updated !== original) {
      await writeFile(path, updated, "utf8");
      changedFiles += 1;
    }
  }

  if (changedFiles > 0) {
    console.log("[startup] Public storefront configuration injected.");
  } else {
    console.log("[startup] Public storefront configuration is already prepared.");
  }
}

await injectPublicEnvironment();
