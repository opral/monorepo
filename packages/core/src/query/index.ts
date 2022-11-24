import type { Bundle, Message, Resource } from "../ast/index.js";
import { Result } from "@inlang/utilities/result";

/**
 * Query a bundle of messages.
 *
 * @example
 * 	 const message = query(bundle).get({ id: "first-message" });
 *
 * @example
 *  // Querying a single resource can be achieved by passing the resource in an array:
 * 	const message = query([resource]).get({ id: "first-message" });
 */
export function query(bundle: Bundle) {
	return {
		/**
		 * Get a message.
		 *
		 * Returns undefined if the message does not exist.
		 */
		get: (args: Parameters<typeof get>[1]) => get(bundle, args),
		/**
		 * Updates a message.
		 *
		 * Returns an error if the message does not exist.
		 */
		update: (args: Parameters<typeof update>[1]) => update(bundle, args),
		/**
		 * Delete a message.
		 *
		 * Returns an error if the message did not exist.
		 */
		delete: (args: Parameters<typeof get>[1]) => _delete(bundle, args),
		/**
		 * Contained message ids in the bundle.
		 */
		ids: () => ids(bundle),
	};
}

function get(
	bundle: Bundle,
	args: { id: Message["id"]["name"] }
): Message | undefined {
	const messages = bundle.resources.flatMap((resource) => resource.body);
	const message = messages.find((message) => message.id.name === args.id);
	if (message) {
		//! do not return a reference to the message in a bundle
		return JSON.parse(JSON.stringify(message));
	}
	return undefined;
}

function update(
	bundle: Bundle,
	args: { id: Message["id"]["name"]; with: Message }
): Result<Bundle, Error> {
	// Copying the Bundle to ensure immutability.
	// The JSON approach does not copy functions which
	// theoretically could be stored in metadata by users.
	const copy: Bundle = JSON.parse(JSON.stringify(bundle));
	for (const [i, resource] of copy.resources.entries()) {
		for (const [j, message] of resource.body.entries()) {
			if (message.id.name === args.id) {
				copy.resources[i].body[j] = args.with;
				return Result.ok(copy);
			}
		}
	}
	return Result.err(Error("Message did not exist."));
}

// using underscore to circumvent javascript reserved keyword 'delete'
function _delete(
	bundle: Bundle,
	args: { id: Message["id"]["name"] }
): Result<Bundle, Error> {
	// Copying the Bundle to ensure immutability.
	// The JSON approach does not copy functions which
	// theoretically could be stored in metadata by users.
	const copy: Bundle = JSON.parse(JSON.stringify(bundle));
	for (const [i, resource] of copy.resources.entries()) {
		for (const [j, message] of resource.body.entries()) {
			if (message.id.name === args.id) {
				delete copy.resources[i].body[j];
				return Result.ok(copy);
			}
		}
	}
	return Result.err(Error("Message did not exist."));
}

function ids(bundle: Bundle): string[] {
	return bundle.resources
		.flatMap((resource) => resource.body)
		.map((message) => message.id.name);
}
