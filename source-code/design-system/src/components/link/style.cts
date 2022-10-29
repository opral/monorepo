import type { CSSRuleObject } from "tailwindcss/types/config";
import type { ParsedConfig } from "../types/parsedConfig.cjs";

export default function (config: ParsedConfig): CSSRuleObject {
	return {
		".link": {
			"@apply font-medium hover:underline": "true",
			transition: "color .25s",
		},
	};
}
