import { InlangConfig01 } from '@inlang/config';

/**
 * The state of the vscode extension.
 */
type State = {
  config: InlangConfig01;
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
  };
}

export let state: State;
