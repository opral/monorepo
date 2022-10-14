import type { InlangConfig } from "@inlang/config";
import type { Bundle } from "@inlang/ast";

/**
 * The state of the vscode extension.
 */
type State = {
	config: InlangConfig;
	/**
	 * The config path is useful to resolve relative paths in the config.
	 */
	configPath: string;
	bundles: Bundle[];
};

/**
 * Initialize the state.
 *
 * Export variables can not be assigned outside of this file. Thus,
 * this function is a wrapper to assign the `state` variable.
 */
export function initState(args: State): void {
	state = {
		config: args.config,
		configPath: args.configPath,
		bundles: args.bundles,
	};
}

export let state: State;
