export type SortDirection = "asc" | "desc";

const compare =
	(direction: SortDirection) =>
	(a: string, b: string): number =>
		direction === "desc" ? b.localeCompare(a) : a.localeCompare(b);

const sortObjectKeys = (value: unknown, direction: SortDirection): unknown => {
	if (Array.isArray(value)) {
		return value.map((entry) => sortObjectKeys(entry, direction));
	}
	if (value === null || typeof value !== "object") {
		return value;
	}
	const sorted: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(value).sort((a, b) =>
		compare(direction)(a[0], b[0])
	)) {
		sorted[key] = sortObjectKeys(entry, direction);
	}
	return sorted;
};

export const sortMessageKeys = <T extends Record<string, unknown>>(
	value: T,
	direction: SortDirection
): T => {
	const sorted: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(value).sort((a, b) =>
		compare(direction)(a[0], b[0])
	)) {
		sorted[key] = sortObjectKeys(entry, direction);
	}
	return sorted as T;
};
