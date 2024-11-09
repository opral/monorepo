import { sha256 } from "js-sha256";
import type { Snapshot } from "../database/schema.js";

/**
 *
 * Util function for tests that creates a snapshot that looks like one you got returned from the database after inserting
 *
 */
export const mockJsonSnapshot = function (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	content: Record<string, any>,
): Snapshot {
	return {
		id: sha256(JSON.stringify(content)),
		content: content,
	};
};
