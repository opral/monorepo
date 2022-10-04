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
			".button-text-${token}": {
				"&:enabled": {
					color: "theme(colors.${token})",
				},
				"&:enabled:hover": {
					color: "theme(colors.hover-${token})",
				},
				"&:enabled:active": {
					color: "theme(colors.active-${token})",
				},
				"&:disabled": {
					color: "theme(colors.disabled-content)",
				},
			},
		}
	);
}
