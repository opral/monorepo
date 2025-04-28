import type { Snapshot } from "./database-schema.js";
import { jsonSha256 } from "./json-sha-256.js";

/**
 *
 * Util function for tests that creates a snapshot that looks like one you got returned from the database after inserting
 *
 */
export function mockJsonSnapshot(content: Record<string, any>): Snapshot {
	return {
		id: jsonSha256(content),
		content: content,
	};
}
