import plugin from "tailwindcss/plugin";
import { styles as button } from "./button/styles.cjs";
import { parseConfig } from "./utilities/parseConfig.cjs";
import type { Config } from "./types/config.cjs";

/**
 * Use this plugin if you want styled components.
 *
 * Nothing can be configured for now. The function exists for future-proofing of the
 * plugin.
 */
export function configure(config: Config) {
	const parsedConfig = parseConfig(config);
	return plugin(({ addComponents }) => {
		for (const component of button) {
			addComponents(component(parsedConfig));
		}
	});
}
