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
	onStateCommit: (handler: (data: any) => void) => () => void;

	/**
	 * Listen to file change events.
	 *
	 * Note: This API will become redundant once subscriptions are implemented.
	 *
	 * Fires when a file is inserted, updated, or deleted in the database.
	 * Useful for updating UI, triggering re-parsing, or synchronizing external systems.
	 *
	 * @param handler - Function to call when a file changes
	 * @returns Unsubscribe function to remove the listener
	 *
	 * @example
	 * ```typescript
	 * const unsubscribe = lix.hooks.onFileChange((fileId, operation) => {
	 *   console.log(`File ${fileId} was ${operation}`);
	 *   if (operation === 'updated') {
	 *     reloadEditor(fileId);
	 *   }
	 * });
	 *
	 * // Later, remove the listener
	 * unsubscribe();
	 * ```
	 */
	onFileChange: (
		handler: (fileId: string, operation: "inserted" | "updated") => void
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
		onStateCommit(handler: (data: any) => void): () => void {
			eventTarget.addEventListener("state_commit", handler);
			return () => eventTarget.removeEventListener("state_commit", handler);
		},

		onFileChange(
			handler: (fileId: string, operation: "inserted" | "updated") => void
		): () => void {
			const wrappedHandler = (event: Event) => {
				const customEvent = event as CustomEvent;
				handler(customEvent.detail.fileId, customEvent.detail.operation);
			};
			eventTarget.addEventListener("file_change", wrappedHandler);
			return () =>
				eventTarget.removeEventListener("file_change", wrappedHandler);
		},

		_emit(eventType: string, data?: any): void {
			eventTarget.dispatchEvent(new CustomEvent(eventType, { detail: data }));
		},
	};
}
