import type { MessageQueryApi, MessageLintReportsQueryApi } from "../api.js"

/**
 * noop implementation of the message query api for use with experimental.persistence = true.
 * NOTE: If we implemented v2 shims for the old api we could use existing tests and make apps
 * backwards compatible.
 */
export const stubMessagesQuery: MessageQueryApi = {
	create: () => false,
	// @ts-expect-error
	get: subscribable(() => undefined),
	// @ts-expect-error
	getByDefaultAlias: subscribable(() => undefined),
	// @ts-expect-error
	includedMessageIds: subscribable(() => []),
	// @ts-expect-error
	getAll: subscribable(() => []),
	update: () => false,
	upsert: () => {},
	delete: () => false,
	setDelegate: () => {},
}

export const stubMessageLintReportsQuery: MessageLintReportsQueryApi = {
	// @ts-expect-error
	get: subscribable(() => []),
	// @ts-expect-error
	getAll: settleable(subscribable(() => [])),
}

// eslint-disable-next-line @typescript-eslint/ban-types
function subscribable(fn: Function) {
	return Object.assign(fn, {
		subscribe: () => {},
	})
}

// eslint-disable-next-line @typescript-eslint/ban-types
function settleable(fn: Function) {
	return Object.assign(fn, {
		settled: async () => [],
	})
}
