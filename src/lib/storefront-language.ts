import { STOREFRONT_TRANSLATIONS, STOREFRONT_TEMPLATES } from "./storefront-translations.ts";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "mr", label: "मराठी" },
  { code: "ar", label: "العربية" },
] as const;
export type StorefrontLanguage = (typeof LANGUAGES)[number]["code"];
export const LANGUAGE_STORAGE_KEY = "aghanims-language-v1";
export function validLanguage(value: unknown): StorefrontLanguage {
  return LANGUAGES.find((language) => language.code === value)?.code || "en";
}
const normalize = (text: string) => text.replace(/\s+/g, " ").trim().toLowerCase();
const dictionary = new Map(STOREFRONT_TRANSLATIONS.map((row) => [normalize(row[0]), row]));
const templates = STOREFRONT_TEMPLATES.map((row) => {
  const keys: string[] = [];
  const source = row[0]
    .split(/(\{\w+\})/)
    .map((part) => {
      if (/^\{\w+\}$/.test(part)) {
        keys.push(part.slice(1, -1));
        return "(.+?)";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return { row, keys, pattern: new RegExp(`^${source}$`, "i") };
}).sort(
  (left, right) =>
    right.row[0].replace(/\{\w+\}/g, "").length - left.row[0].replace(/\{\w+\}/g, "").length,
);

export function translateStorefrontText(text: string, language: StorefrontLanguage): string {
  if (language === "en" || !text.trim()) return text;
  const index = language === "hi" ? 1 : language === "mr" ? 2 : 3;
  const trimmed = text.replace(/\s+/g, " ").trim();
  let translated = dictionary.get(normalize(trimmed))?.[index];
  if (!translated)
    for (const template of templates) {
      const match = template.pattern.exec(trimmed);
      if (!match) continue;
      translated = template.row[index].replace(
        /\{(\w+)\}/g,
        (_, key) => match[template.keys.indexOf(key) + 1] || "",
      );
      break;
    }
  if (!translated) return text;
  return `${text.match(/^\s*/)?.[0] || ""}${translated}${text.match(/\s*$/)?.[0] || ""}`;
}
