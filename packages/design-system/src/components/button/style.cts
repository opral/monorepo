import type { CSSRuleObject } from "tailwindcss/types/config";
import type { ParsedConfig } from "../types/parsedConfig.cjs";

export default function (config: ParsedConfig): CSSRuleObject {
	return {
		".button": {
			"@apply mr-2 mb-2 inline-flex items-center gap-1.5 disabled:cursor-not-allowed":
				"true",
			// every button should have the same measurements.
			// some buttons style borders. thus, give every
			// button a transparent border that can be overwritten
			// by variants.
			"border-width": "theme(borderWidth.DEFAULT)",
			"border-color": "rgba(0, 0, 0, 0.0)",
			"border-radius": `theme(borderRadius.${config.borderRadius("DEFAULT")})`,
		},
		".button.button-sm": {
			"@apply py-2 px-3 text-xs font-medium": "true",
		},
		// DEFAULT
		".button, .button-base": {
			"@apply py-2 px-3.5 text-sm font-medium": "true",
		},
		".button.button-lg": {
			"@apply py-3 px-5 text-base font-medium": "true",
		},
	};
}
