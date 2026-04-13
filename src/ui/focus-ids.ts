import type {Locale} from "../types.js";

export const PANEL_IDS = {
  left: "panel:left",
  center: "panel:center",
  footer: "panel:footer"
} as const;

export function getPanelLabel(id: string | undefined, locale: Locale) {
  switch (id) {
    case PANEL_IDS.left:
      return locale === "zh" ? "观测板" : "Doctrine";
    case PANEL_IDS.center:
      return locale === "zh" ? "视域" : "Viewport";
    case PANEL_IDS.footer:
      return locale === "zh" ? "输入台" : "Console";
    default:
      return locale === "zh" ? "未锁定" : "Unfocused";
  }
}
