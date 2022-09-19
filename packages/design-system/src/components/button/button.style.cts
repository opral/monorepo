import { USED_CONFIG } from "../../colors/tailwindPlugin.cjs";
import { forEachColorToken } from "../utilities/forEachColorToken.cjs";

export const style = forEachColorToken(
	Object.keys({ ...USED_CONFIG.accentColors, ...USED_CONFIG.semanticColors }),
	{
		".button-${token}": {
			color: "theme(colors.on-${token})",
			"background-color": "theme(colors.${token})",
			"&:hover": {
				"background-color": "theme(colors.hover-${token})",
			},
		},
	}
);
