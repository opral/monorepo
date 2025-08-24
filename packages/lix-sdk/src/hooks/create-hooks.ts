import type { Change } from "../change/index.js";

/**
 * Change data passed to state commit hooks.
 * Extends the standard Change type with tracking information.
 */
export type StateCommitChange = Change & {
	/**
	 * Whether this change is untracked (bypasses change control).
	 * Untracked changes are stored directly without creating change records.
	 */
	untracked?: number; // 0 for tracked, 1 for untracked
};

/**
 * Lix hooks system for listening to database lifecycle events.
 *
 * Hooks allow you to register callbacks that fire at specific points
 * in Lix's execution, such as when state changes are committed.
 */
export type LixHooks = {
	/**
	 * Listen to state commit events.
	 *
	 * Fires after any state mutation is committed to the database.
	 * Useful for auto-saving, cache invalidation, sync operations, etc.
	 *
	 * @param handler - Function to call when state is committed
	 * @returns Unsubscribe function to remove the listener
	 *
	 * @example
	 * ```typescript
	 * const unsubscribe = lix.hooks.onStateCommit(() => {
	 *   console.log('State was committed!');
	 *   storage.save();
	 * });
	 *
	 * // Later, remove the listener
	 * unsubscribe();
	 * ```
	 */
	onStateCommit: (
		handler: (data: { changes: StateCommitChange[] }) => void
	) => () => void;

	/**
	 * Internal method for emitting events.
	 *
	 * @internal
	 * This method is for internal use only and should not be called directly.
	 * Use this to emit events from state mutation functions.
	 */
	_emit: (eventType: string, data?: any) => void;
};

/**
 * Creates a new hooks system for a Lix instance.
 *
 * Uses the native EventTarget API under the hood for efficient
 * event handling and automatic memory management.
 *
 * @returns LixHooks instance with event subscription methods
 */
export function createHooks(): LixHooks {
	const eventTarget = new EventTarget();

	return {
		onStateCommit(
			handler: (data: { changes: StateCommitChange[] }) => void
		): () => void {
			const wrappedHandler = (event: Event) => {
				const customEvent = event as CustomEvent;
				handler(customEvent.detail);
			};
			eventTarget.addEventListener("state_commit", wrappedHandler);
			return () =>
				eventTarget.removeEventListener("state_commit", wrappedHandler);
		},

		_emit(eventType: string, data?: any): void {
			eventTarget.dispatchEvent(new CustomEvent(eventType, { detail: data }));
		},
	};
}
