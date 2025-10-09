export type MentionMatch = {
	start: number;
	end: number;
	query: string;
};

const MENTION_REGEX = /(^|[\s])@([A-Za-z0-9_./-]*)$/;

/**
 * Finds the mention token preceding the caret. Mirrors Claude Code behavior.
 */
export function calculateMentionRange(
	text: string,
	cursor: number,
): MentionMatch | null {
	const safeIndex = Math.min(Math.max(cursor, 0), text.length);
	const before = text.slice(0, safeIndex);
	const match = MENTION_REGEX.exec(before);
	if (!match) return null;
	const query = match[2] ?? "";
	const start = Math.max(0, safeIndex - (query.length + 1));
	return {
		start,
		end: safeIndex,
		query,
	};
}

export function buildMentionList(
	query: string,
	files: readonly string[],
	limit = 10,
) {
	if (!query) return files.slice(0, limit);
	const needle = query.toLowerCase();
	return files
		.filter((file) => file.toLowerCase().includes(needle))
		.slice(0, limit);
}
