import { USED_CONFIG } from "../../colors/tailwindPlugin.cjs";
import { forEachColorToken } from "../utilities/forEachColorToken.cjs";

export const style = [
	{
		"sl-badge::part(base)": {
			"border-radius": "theme(borderRadius.sm)",
		},
	},
	...forEachColorToken(
		Object.keys({
			...USED_CONFIG.accentColors,
			...USED_CONFIG.semanticColors,
		}),
		{
			".badge-${token}::part(base)": {
				"background-color": "theme(colors.${token})",
				color: "theme(colors.on-${token})",
				border: "solid theme(borderWidth.DEFAULT) theme(colors.${token})",
			},
		}
	),
];
