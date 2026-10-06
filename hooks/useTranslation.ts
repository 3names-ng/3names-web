// hooks/useTranslation.ts
//
// Drop-in hook: reads the current language from the store and returns a
// `t(key, params?)` function that resolves translated strings with
// simple {{param}} interpolation.

import { useCallback, useMemo } from "react";
import { useLanguageStore, type LanguageCode } from "@/store/languageStore";
import { t as translate, type TranslationKey } from "@/translations";

/**
 * Simple interpolation: replaces `{{key}}` placeholders with values.
 *
 * @example
 *   interpolate("Hello {{name}}!", { name: "Chidi" })
 *   // => "Hello Chidi!"
 */
function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`,
  );
}

/**
 * Hook that provides translated strings for the current app language.
 *
 * @example
 *   const { t, language } = useTranslation();
 *   t("tab.home")           // => "Home" | "Accueil" | …
 *   t("chat.sentGift", { name: "Chidi", gift: "Rose", count: 10 })
 *   // => "Chidi sent Rose x10"  (in the current language)
 */
export function useTranslation() {
  const language = useLanguageStore((s) => s.language);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const raw = translate(key, language);
      return interpolate(raw, params);
    },
    [language],
  );

  return useMemo(() => ({ t, language }), [t, language]);
}
