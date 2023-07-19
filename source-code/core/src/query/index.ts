import type { Message } from "../ast/index.js"
import type { Result } from "../utilities/result.js"

/**
 * Query a resource.
 *
 * All actions are immutable.
 *
 * @example
 * 	const message = query(resource).get({ id: "first-message" });
 *
 * @example
 * 	const updatedResource = query(resource).delete({ id: "example" });
 */
export function query(messages: Message[]) {
	return {
		/**
		 * Creates a message in a resource.
		 *
		 * Returns an error if the message already exists, or the resource
		 * does not exist.
		 */
		create: (args: Parameters<typeof create>[1]) => create(messages, args),
		/**
		 * Get a message.
		 *
		 * Returns undefined if the message does not exist.
		 */
		get: (args: Parameters<typeof get>[1]) => get(messages, args),
		/**
		 * Updates a message.
		 *
		 * Returns an error if the message does not exist.
		 */
		update: (args: Parameters<typeof update>[1]) => update(messages, args),
		/**
		 * Upserts a message.
		 */
		upsert: (args: Parameters<typeof upsert>[1]) => upsert(messages, args),
		/**
		 * Delete a message.
		 *
		 * Returns an error if the message did not exist.
		 */
		delete: (args: Parameters<typeof get>[1]) => _delete(messages, args),
		/**
		 * Included message ids in a resource.
		 */
		includedMessageIds: () => includedMessageIds(messages),
	}
}

class MessageAlreadyExistsException extends Error {
	readonly #id = "MessageAlreadyExistsException"

	constructor(messageId: string, resourceId: string) {
		super(`Message '${messageId}' already exists in resource '${resourceId}'.`)
	}
}

function create(
	messages: Message[],
	args: { message: Message },
): Result<Message[], MessageAlreadyExistsException> {
	// Copying the Resource to ensure immutability.
	// The JSON approach does not copy functions which
	// theoretically could be stored in metadata by users.
	const copy: Message[] = JSON.parse(JSON.stringify(messages))
	if (get(copy, { id: args.message.id, languageTag: args.message.languageTag })) {
		return [undefined, new MessageAlreadyExistsException(args.message.id, args.message.languageTag)]
	}
	copy.push(args.message)
	return [copy, undefined]
}

function upsert(messages: Message[], args: { message: Message }): Result<Message[], Error> {
	const existingMessage = get(messages, {
		id: args.message.id,
		languageTag: args.message.languageTag,
	})
	if (existingMessage) {
		const [updatedResource, exception] = update(messages, {
			id: args.message.id,
			languageTag: args.message.languageTag,
			with: args.message,
		})
		if (exception) {
			return [
				undefined,
				Error(
					"Message from an update is undefined. Even though an if statement checked is the message existed. This is an internal bug in inlang.",
					{ cause: exception },
				),
			]
		}
		return [updatedResource, undefined]
	}
	const [updatedResource, exception] = create(messages, args)
	if (exception) {
		// should throw because internal error that should never happen
		throw Error(
			"Message already exists even though we checked if a message exists. This is an internal bug in inlang.",
			{ cause: exception },
		)
	}
	return [updatedResource, undefined]
}

function get(
	messages: Message[],
	args: { id: Message["id"]; languageTag: Message["languageTag"] },
): Message | undefined {
	const message = messages.find(
		(message) => message.id === args.id && message.languageTag === args.languageTag,
	)
	if (message) {
		//! do not return a reference to the message in a resource
		//! modifications to the returned message will leak into the
		//! resource which is considered to be unmutable.
		return JSON.parse(JSON.stringify(message))
	}
	return undefined
}

class MessageDoesNotExistsException extends Error {
	readonly #id = "MessageDoesNotExistsException"

	constructor(messageId: string, resourceId: string) {
		super(`Message '${messageId}' does not exist in resource '${resourceId}'.`)
	}
}

function update(
	messages: Message[],
	args: { id: Message["id"]; languageTag: Message["languageTag"]; with: Message },
): Result<Message[], MessageDoesNotExistsException> {
	// Copying the Resource to ensure immutability.
	// The JSON approach does not copy functions which
	// theoretically could be stored in metadata by users.
	const copy: Message[] = JSON.parse(JSON.stringify(messages))
	for (const [i, message] of messages.entries()) {
		if (message.id === args.id && message.languageTag === args.languageTag) {
			copy[i] = args.with
			return [copy, undefined]
		}
	}
	return [undefined, new MessageDoesNotExistsException(args.id, args.languageTag)]
}

// using underscore to circumvent javascript reserved keyword 'delete'
function _delete(
	messages: Message[],
	args: { id: Message["id"]; languageTag: Message["languageTag"] },
): Result<Message[], MessageDoesNotExistsException> {
	// Copying the Resource to ensure immutability.
	// The JSON approach does not copy functions which
	// theoretically could be stored in metadata by users.
	const copy: Message[] = JSON.parse(JSON.stringify(messages))
	for (const [i, message] of messages.entries()) {
		if (message.id === args.id && message.languageTag === args.languageTag) {
			// deleting 1 element at index
			copy.splice(i, 1)
			return [copy, undefined]
		}
	}
	return [undefined, new MessageDoesNotExistsException(args.id, args.languageTag)]
}

function includedMessageIds(messages: Message[]): string[] {
	return messages.map((message) => message.id)
}
