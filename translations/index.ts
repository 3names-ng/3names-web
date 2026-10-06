// translations/index.ts
// Central hub: maps language codes → string bundles and exposes a `t()` helper.

import en from "./en";
import fr from "./fr";
import ig from "./ig";
import ha from "./ha";
import yo from "./yo";
import type { TranslationKey } from "./en";
import type { LanguageCode } from "@/store/languageStore";

export type { TranslationKey };

/** All available translation bundles keyed by LanguageCode.
 *  Bundles are partial by design: `t()` falls back to English for any key a
 *  translation hasn't caught up on yet, so a missing string degrades to the
 *  English one instead of breaking the build. */
const translations: Record<LanguageCode, Partial<Record<TranslationKey, string>>> = {
  en,
  fr,
  ig,
  ha,
  yo,
};

/**
 * Get a translated string for the given key and language code.
 * Falls back to English if the key is missing in the target language.
 *
 * @example
 *   t("tab.home", "fr")  // => "Accueil"
 *   t("error.generic", "ig")  // => "Ihe nwere ike ime. Biko nwaa ọzọ."
 */
export function t(key: TranslationKey, lang: LanguageCode = "en"): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

/**
 * Get the full string bundle for a language.
 */
export function getBundle(lang: LanguageCode): Partial<Record<TranslationKey, string>> {
  return translations[lang] ?? translations.en;
}
