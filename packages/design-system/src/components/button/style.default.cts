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
		".button-${token}": {
			"&:enabled": {
				color: "theme(colors.on-${token})",
				"background-color": "theme(colors.${token})",
				// The default button needs a border too
				// in case default and outline buttons are used at the same time.
				"border-color": "theme(colors.${token})",
				"border-width": "theme(borderWidth.DEFAULT)",
			},
			"&:enabled:hover": {
				"border-color": "theme(colors.hover-${token})",
				"background-color": "theme(colors.hover-${token})",
			},
			"&:enabled:focus": {
				"border-color": "theme(colors.focus-${token})",
				"background-color": "theme(colors.focus-${token})",
			},
			"&:enabled:active": {
				"border-color": "theme(colors.active-${token})",
				"background-color": "theme(colors.active-${token})",
			},
			"&:disabled": {
				color: "theme(colors.disabled-content)",
				"border-color": "theme(colors.disabled-container)",
				"border-width": "theme(borderWidth.DEFAULT)",
			},
		},
	}
);
