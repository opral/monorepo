/**
 * State-committed row emitted to `onStateCommit` subscribers.
 *
 * These are state-shaped (not low-level change rows) and include operational columns such as
 * `version_id`, `commit_id`, optional `untracked`, and `writer_key`.
 *
 * Untracked rows (like derived change-set elements or log-style inserts) surface with
 * `untracked: 1` and a sentinel `commit_id: "untracked"` because they do not belong to a
 * materialized commit yet. Observers should treat the pair `(untracked === 1, commit_id === "untracked")`
 * as “ephemeral” data and avoid dereferencing the commit.
 *
 * The `writer_key` identifies the writer responsible for the materialized state row and enables
 * echo suppression in UIs (filter out your own writes while reacting to external ones). When no
 * explicit writer is provided (the default), the value is `null`.
 *
 * See the writer key guide for patterns and pitfalls.
 */
export type StateCommitChange = {
	id: string;
	entity_id: string;
	schema_key: string;
	schema_version: string;
	file_id: string;
	plugin_key: string;
	created_at: string;
	snapshot_content: Record<string, any> | null;
	version_id: string;
	commit_id: string;
	/** 0 for tracked, 1 for untracked */
	untracked?: number;
	/** Arbitrary metadata attached to the originating change, if any. */
	metadata?: Record<string, any> | null;
	/**
	 * Writer identity that produced this state row, if known.
	 *
	 * Used for echo suppression (ignore my own writes; react to external ones).
	 * See docs: https://lix.dev/guide/writer-key
	 */
	writer_key: string | null;
};

/**
 * Change data passed to state commit hooks.
 * Extends the standard Change type with tracking information.
 */
// (No longer extends Change; state commits carry state-level operational columns.)

/**
 * Lix hooks system for listening to database lifecycle events.
 *
 * Hooks allow you to register callbacks that fire at specific points
 * in Lix's execution, such as when state changes are committed.
 */
type HookEvents = {
	state_commit: { changes: StateCommitChange[] };
	file_change: { fileId: string; operation: "inserted" | "updated" };
};

type HookEventType = keyof HookEvents;

export type LixHooks = {
	/**
	 * Listen to state commit events.
	 *
	 * Fires after any state mutation is committed to the database.
	 * Useful for auto-saving, cache invalidation, sync operations, etc.
	 *
	 * Payload carries `changes: StateCommitChange[]`, including `writer_key` for each state row
	 * (when applicable). For UIs, filter by writer to suppress echoes, e.g.:
	 *
	 * ```ts
	 * const writer_key = 'app_component_<session_id>'
	 * lix.hooks.onStateCommit(({ changes }) => {
	 *   const external = changes.some(c =>
	 *     c.file_id === activeFileId && (c.writer_key == null || c.writer_key !== writer_key)
	 *   )
	 *   if (external) refresh()
	 * })
	 * ```
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
	_emit: <T extends HookEventType>(
		eventType: T,
		data: HookEvents[T]
	) => void;
};

/**
 * Creates a new hooks system for a Lix instance.
 *
 * Uses the native EventTarget API under the hood for efficient
 * event handling and automatic memory management.
 *
 * @returns LixHooks instance with event subscription methods
 */
function ensureCustomEventPolyfill(): void {
	if (typeof globalThis.CustomEvent === "function") {
		return;
	}

	class NodeCustomEvent<T = unknown> extends Event {
		readonly detail: T;
		constructor(type: string, params?: CustomEventInit<T>) {
			super(type, params);
			this.detail = (params?.detail ?? null) as T;
		}
	}

	(globalThis as unknown as { CustomEvent: typeof CustomEvent }).CustomEvent =
		NodeCustomEvent as unknown as typeof CustomEvent;
}

export function createHooks(): LixHooks {
	ensureCustomEventPolyfill();

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

		_emit<T extends HookEventType>(
			eventType: T,
			data: HookEvents[T]
		): void {
			eventTarget.dispatchEvent(new CustomEvent(eventType, { detail: data }));
		},
	};
}
