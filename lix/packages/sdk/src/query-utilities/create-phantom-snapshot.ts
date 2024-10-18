import { sha256 } from "js-sha256";

/**
 *
 * Util function for tests that creates a snapshot that looks like one you got returned from the database after inserting
 * @param content
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createPhantomSnapshot = function (content: Record<string, any>) {
	return {
		id: sha256(JSON.stringify(content)),
		content: content,
	};
};
