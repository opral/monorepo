import plugin from "tailwindcss/plugin";
import { tokens } from "./tokens.cjs";

/**
 * Entrypoint of the plugin.
 *
 * Nothing can be configured for now. The function exists for consistency
 * with the typography and color plugins and future-proofing of the component
 * plugin itself.
 */
export function configure() {
	return plugin(({ addUtilities }) => {
		addUtilities(tokens);
	});
}
