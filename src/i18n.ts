import type {DisplayText, Locale, LocalizedText} from "./types.js";

export function lt(en: string, zh: string): LocalizedText {
  return {en, zh};
}

export function txt(locale: Locale, value: LocalizedText): string {
  return locale === "zh" ? value.zh : value.en;
}

export function displayText(locale: Locale, value: DisplayText): string {
  return typeof value === "string" ? value : txt(locale, value);
}

export function nextLocale(locale: Locale): Locale {
  return locale === "zh" ? "en" : "zh";
}

export function localeTag(locale: Locale): string {
  return locale === "zh" ? "中文" : "EN";
}
