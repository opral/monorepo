import type { CSSRuleObject } from "tailwindcss/types/config"
import { USED_COLOR_SYSTEM_CONFIG } from "../../color-system/tailwindPlugin.cjs"
import { forEachColorToken } from "../forEachColorToken.cjs"

export default function (): CSSRuleObject[] {
	const base = {
		".link": {
			"@apply font-medium hover:text-on-background": "true",
			transition: "color .1s",
		},
	}

	const color = forEachColorToken(
		Object.keys({
			...USED_COLOR_SYSTEM_CONFIG.accentColors,
			...USED_COLOR_SYSTEM_CONFIG.semanticColors,
		}),
		{
			".link-${token}": {
				"@apply hover:text-hover-${token}": "true",
			},
		},
	)
	return [base, color]
}
