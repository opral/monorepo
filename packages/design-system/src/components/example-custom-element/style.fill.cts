import { USED_COLOR_SYSTEM_CONFIG } from "../../color-system/tailwindPlugin.cjs";
import { forEachColorToken } from "../utilities/forEachColorToken.cjs";

export const style = forEachColorToken(
	Object.keys({
		...USED_COLOR_SYSTEM_CONFIG.accentColors,
		...USED_COLOR_SYSTEM_CONFIG.semanticColors,
	}),
	{
		".button-fill-${token}": {
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
