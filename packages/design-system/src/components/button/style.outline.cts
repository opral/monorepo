import { USED_CONFIG } from "../../colors/tailwindPlugin.cjs";
import { forEachColorToken } from "../utilities/forEachColorToken.cjs";

// Theoretically, the color tokens for buttons are always primary.
// But, generating buttons for all accent and semantic colors
// reflects the color coding of web apps.
// See https://carbondesignsystem.com/components/button/usage/#emphasis
// and https://m3.material.io/styles/color/the-color-system/color-roles
export const style = forEachColorToken(
	Object.keys({ ...USED_CONFIG.accentColors, ...USED_CONFIG.semanticColors }),
	{
		".button-outline-${token}": {
			"&:enabled": {
				color: "theme(colors.${token})",
				"border-color": "theme(colors.${token})",
				"border-width": "theme(borderWidth.DEFAULT)",
			},
			"&:enabled:hover": {
				color: "theme(colors.on-${token})",
				"background-color": "theme(colors.hover-${token})",
			},
			"&:enabled:focus": {
				color: "theme(colors.on-${token})",
				"background-color": "theme(colors.focus-${token})",
			},
			"&:enabled:press": {
				color: "theme(colors.on-${token})",
				"background-color": "theme(colors.press-${token})",
			},
			"&:disabled": {
				color: "theme(colors.disabled-content)",
				"border-color": "theme(colors.disabled-container)",
				"border-width": "theme(borderWidth.DEFAULT)",
			},
		},
	}
);
