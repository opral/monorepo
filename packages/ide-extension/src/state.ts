import { InlangConfig01 } from "@inlang/config";
import { Resources } from "@inlang/fluent-syntax";

/**
 * The state of the vscode extension.
 */
type State = {
	config: InlangConfig01;
	/**
	 * The config path is useful to resolve relative paths in the config.
	 */
	configPath: string;
	resources: Resources;
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
		resources: args.resources,
	};
}

export let state: State;
