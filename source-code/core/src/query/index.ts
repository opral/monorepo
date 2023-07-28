import type { Message, Resource } from "../ast/index.js"
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
export function query(resource: Resource) {
	return {
		/**
		 * Creates a message in a resource.
		 *
		 * Returns an error if the message already exists, or the resource
		 * does not exist.
		 */
		create: (args: Parameters<typeof create>[1]) => create(resource, args),
		/**
		 * Get a message.
		 *
		 * Returns undefined if the message does not exist.
		 */
		get: (args: Parameters<typeof get>[1]) => get(resource, args),
		/**
		 * Updates a message.
		 *
		 * Returns an error if the message does not exist.
		 */
		update: (args: Parameters<typeof update>[1]) => update(resource, args),
		/**
		 * Upserts a message.
		 */
		upsert: (args: Parameters<typeof upsert>[1]) => upsert(resource, args),
		/**
		 * Delete a message.
		 *
		 * Returns an error if the message did not exist.
		 */
		delete: (args: Parameters<typeof get>[1]) => _delete(resource, args),
		/**
		 * Included message ids in a resource.
		 */
		includedMessageIds: () => includedMessageIds(resource),
	}
}

class MessageAlreadyExistsException extends Error {
	readonly #id = "MessageAlreadyExistsException"

	constructor(messageId: string, resourceId: string) {
		super(`Message '${messageId}' already exists in resource '${resourceId}'.`)
	}
}

function create(
	resource: Resource,
	args: { message: Message },
): Result<Resource, MessageAlreadyExistsException> {
	// Copying the Resource to ensure immutability.
	// The JSON approach does not copy functions which
	// theoretically could be stored in metadata by users.
	const copy: Resource = JSON.parse(JSON.stringify(resource))
	if (get(copy, { id: args.message.id.name })) {
		return [
			undefined,
			new MessageAlreadyExistsException(args.message.id.name, resource.languageTag.name),
		]
	}
	copy.body.push(args.message)
	return [copy, undefined]
}

function upsert(resource: Resource, args: { message: Message }): Result<Resource, Error> {
	const existingMessage = get(resource, { id: args.message.id.name })
	if (existingMessage) {
		const [updatedResource, exception] = update(resource, {
			id: args.message.id.name,
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
	const [updatedResource, exception] = create(resource, args)
	if (exception) {
		// should throw because internal error that should never happen
		throw Error(
			"Message already exists even though we checked if a message exists. This is an internal bug in inlang.",
			{ cause: exception },
		)
	}
	return [updatedResource, undefined]
}

function get(resource: Resource, args: { id: Message["id"]["name"] }): Message | undefined {
	const message = resource.body.find((message) => message.id.name === args.id)
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
	resource: Resource,
	args: { id: Message["id"]["name"]; with: Message },
): Result<Resource, MessageDoesNotExistsException> {
	// Copying the Resource to ensure immutability.
	// The JSON approach does not copy functions which
	// theoretically could be stored in metadata by users.
	const copy: Resource = JSON.parse(JSON.stringify(resource))
	for (const [i, message] of resource.body.entries()) {
		if (message.id.name === args.id) {
			copy.body[i] = args.with
			return [copy, undefined]
		}
	}
	return [undefined, new MessageDoesNotExistsException(args.id, resource.languageTag.name)]
}

// using underscore to circumvent javascript reserved keyword 'delete'
function _delete(
	resource: Resource,
	args: { id: Message["id"]["name"] },
): Result<Resource, MessageDoesNotExistsException> {
	// Copying the Resource to ensure immutability.
	// The JSON approach does not copy functions which
	// theoretically could be stored in metadata by users.
	const copy: Resource = JSON.parse(JSON.stringify(resource))
	for (const [i, message] of resource.body.entries()) {
		if (message.id.name === args.id) {
			// deleting 1 element at index
			copy.body.splice(i, 1)
			return [copy, undefined]
		}
	}
	return [undefined, new MessageDoesNotExistsException(args.id, resource.languageTag.name)]
}

function includedMessageIds(resource: Resource): string[] {
	return resource.body.map((message) => message.id.name)
}
