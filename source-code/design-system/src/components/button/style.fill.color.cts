import type { CSSRuleObject } from "tailwindcss/types/config.js";
import { USED_COLOR_SYSTEM_CONFIG } from "../../color-system/tailwindPlugin.cjs";
import type { ParsedConfig } from "../types/parsedConfig.cjs";
import { forEachColorToken } from "../utilities/forEachColorToken.cjs";

export default function (config: ParsedConfig): CSSRuleObject {
	return forEachColorToken(
		Object.keys({
			...USED_COLOR_SYSTEM_CONFIG.accentColors,
			...USED_COLOR_SYSTEM_CONFIG.semanticColors,
		}),
		{
			".button-fill-${token}": {
				"&:enabled": {
					color: "theme(colors.on-${token})",
					"background-color": "theme(colors.${token})",
					"border-color": "theme(colors.${token})",
				},
				"&:enabled:hover": {
					"border-color": "theme(colors.hover-${token})",
					"background-color": "theme(colors.hover-${token})",
				},
				// button stays in focus after click which is irretating
				// hence, disable focus for now
				// "&:enabled:focus": {
				// 	"border-color": "theme(colors.focus-${token})",
				// 	"background-color": "theme(colors.focus-${token})",
				// },
				"&:enabled:active": {
					"border-color": "theme(colors.active-${token})",
					"background-color": "theme(colors.active-${token})",
				},
				"&:disabled": {
					color: "theme(colors.disabled-content)",
					"border-color": "theme(colors.disabled-container)",
				},
			},
		}
	);
}
