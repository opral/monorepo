import type { Bundle, Message, Resource } from "../ast/index.js";

export function query(bundle: Bundle) {
	// let bundle: Bundle;
	// if (node.type === "Resource") {
	// 	bundle = {
	// 		type: "Bundle",
	// 		id: {
	// 			type: "Identifier",
	// 			name: "This bundle has a mock ID to support easier querying of resources.",
	// 		},
	// 		resources: [node],
	// 	};
	// } else {
	// 	bundle = node;
	// }
	return {
		get: (args: Parameters<typeof get>[1]) => get(bundle, args),
		delete: (args: Parameters<typeof get>[1]) => _delete(bundle, args),
	};
}

function get(
	bundle: Bundle,
	args: { id: Message["id"]["name"] }
): Message | undefined {
	const messages = bundle.resources.flatMap((resource) => resource.body);
	const message = messages.find((message) => message.id.name === args.id);
	return message;
}

// using underscore to circumvent javascript reserved keyword 'delete'
function _delete(bundle: Bundle, args: { id: Message["id"]["name"] }): any {
	const messages = bundle.resources.flatMap((resource) => resource.body);
}
