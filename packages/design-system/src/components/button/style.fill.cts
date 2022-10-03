import { USED_CONFIG } from "../../colors/tailwindPlugin.cjs";
import { forEachColorToken } from "../utilities/forEachColorToken.cjs";

export const style = forEachColorToken(
	Object.keys({ ...USED_CONFIG.accentColors, ...USED_CONFIG.semanticColors }),
	{
		"sl-button.color-${token}.button--standard::part(base)": {
			color: "theme(colors.on-${token})",
			"background-color": "theme(colors.${token})",
			// Needs a border in case default and outline buttons are used at the same time.
			"border-color": "theme(colors.${token})",
			"border-width": "theme(borderWidth.DEFAULT)",
			"&:hover": {
				"border-color": "theme(colors.hover-${token})",
				"background-color": "theme(colors.hover-${token})",
			},
			"&:active": {
				"border-color": "theme(colors.active-${token})",
				"background-color": "theme(colors.active-${token})",
			},
		},
		"sl-button.color-${token}.button--standard::part(label)": {
			color: "theme(colors.on-${token})",
		},
		"sl-button.color-${token}.button--standard::part(prefix)": {
			color: "theme(colors.on-${token})",
		},
		"sl-button.color-${token}.button--standard::part(suffix)": {
			color: "theme(colors.on-${token})",
		},
		"sl-button.color-${token}.button--standard::part(caret)": {
			color: "theme(colors.on-${token})",
		},
	}
);
