import type { InlangProject } from "@inlang/sdk"

// TODO #1844 CLEARIFY Felix the state seems to set in the initProject method but seams to never be disposed?
/**
 * The state of the vscode extension.
 */
type State = {
	/**
	 * Inlang project
	 */
	project: InlangProject
}

let _state: State

/**
 * Set the state.
 *
 * Export variables can not be assigned outside of this file. Thus,
 * this function is a wrapper to assign the `state` variable.
 */
export function setState(state: State) {
	_state = state
}

/**
 * Returns the current state.
 *
 * The state is a function because importing a variable
 * is static i.e. if the variable is mutated after an
 * import occured, the change (might) not be reflected.
 * State that is not reflected = endless bugs.
 */
export function state(): State {
	return _state
}
