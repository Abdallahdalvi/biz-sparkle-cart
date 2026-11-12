import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import {
  LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  translateStorefrontText,
  validLanguage,
  type StorefrontLanguage,
} from "@/lib/storefront-language";

const LanguageContext = createContext<{
  language: StorefrontLanguage;
  setLanguage: (language: StorefrontLanguage) => void;
}>({ language: "en", setLanguage: () => {} });
export const useStorefrontLanguage = () => useContext(LanguageContext);
type OriginalText = { source: string; rendered: string };

export function StorefrontLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<StorefrontLanguage>("en");
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const texts = useRef(new WeakMap<Text, OriginalText>());
  const attributes = useRef(new WeakMap<Element, Map<string, OriginalText>>());
  useEffect(() => {
    try {
      setLanguageState(validLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY)));
    } catch {
      /* The selector also works without browser storage. */
    }
  }, []);
  const setLanguage = (next: StorefrontLanguage) => {
    setLanguageState(next);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      /* Keep the selection for this visit. */
    }
  };
  useEffect(() => {
    const current = pathname.startsWith("/admin") ? "en" : language;
    document.documentElement.lang = current;
    document.documentElement.dir = current === "ar" ? "rtl" : "ltr";
    const protectedContent =
      "script,style,noscript,code,pre,textarea,blockquote,[translate='no'],[data-no-translate]";
    const excluded = `${protectedContent},.material-symbols-outlined`;
    const skip = (element: Element | null) => !element || Boolean(element.closest(excluded));
    const translateText = (node: Text) => {
      if (skip(node.parentElement)) return;
      const value = node.nodeValue || "";
      let original = texts.current.get(node);
      if (!original || value !== original.rendered) original = { source: value, rendered: value };
      const result = translateStorefrontText(original.source, current);
      original.rendered = result;
      texts.current.set(node, original);
      // Preserve React's text-node identities. Never wrap, replace or remove DOM nodes.
      if (value !== result) node.nodeValue = result;
    };
    const translateAttributes = (element: Element) => {
      if (element.closest(protectedContent)) return;
      const originals = attributes.current.get(element) || new Map<string, OriginalText>();
      for (const key of ["placeholder", "aria-label", "title"]) {
        const value = element.getAttribute(key);
        if (value === null) continue;
        let original = originals.get(key);
        if (!original || value !== original.rendered) original = { source: value, rendered: value };
        const result = translateStorefrontText(original.source, current);
        original.rendered = result;
        originals.set(key, original);
        if (value !== result) element.setAttribute(key, result);
      }
      attributes.current.set(element, originals);
    };
    const translateTree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        translateText(root as Text);
        return;
      }
      if (!(root instanceof Element) || skip(root)) return;
      translateAttributes(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) translateText(node as Text);
      root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(translateAttributes);
    };
    translateTree(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") translateText(record.target as Text);
        else if (record.type === "attributes") translateAttributes(record.target as Element);
        else record.addedNodes.forEach(translateTree);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title"],
    });
    return () => observer.disconnect();
  }, [language, pathname]);
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function LanguageSelector() {
  const { language, setLanguage } = useContext(LanguageContext);
  return (
    <label
      data-no-translate
      dir="ltr"
      className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-700/40 bg-white/90 px-1.5 text-slate-950"
    >
      <Globe aria-hidden="true" className="h-3.5 w-3.5" />
      <span className="sr-only">Language / भाषा / اللغة</span>
      <select
        aria-label="Language / भाषा / اللغة"
        value={language}
        onChange={(event) => setLanguage(validLanguage(event.target.value))}
        className="h-7 max-w-[88px] bg-transparent text-xs font-semibold outline-none"
      >
        {LANGUAGES.map((option) => (
          <option key={option.code} value={option.code} lang={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
