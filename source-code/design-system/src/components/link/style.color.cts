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
			".link-${token}": {
				"@apply hover:text-hover-${token}": "true",
			},
		}
	);
}
