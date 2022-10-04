import { Resource } from "../classes/index.js";
import { serialize } from "@fluent/syntax";

/**
 * Serializes a `Resource` to a fluent file (string).
 */
export function serializeResource(resource: Resource): string {
	return serialize(resource, { withJunk: true });
}
