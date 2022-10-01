import { USED_CONFIG } from "../../colors/tailwindPlugin.cjs";
import { forEachColorToken } from "../utilities/forEachColorToken.cjs";

export const style = forEachColorToken(
	Object.keys({
		...USED_CONFIG.accentColors,
		...USED_CONFIG.semanticColors,
	}),
	{
		".badge-${token}::part(base)": {
			"background-color": "theme(colors.${token})",
			color: "theme(colors.on-${token})",
		},
	}
);
