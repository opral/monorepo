/**
 * Converts a UTC timestamp to user's local time with a consistent format
 */
export const toUserTime = (timestamp: string): string => {
	const date = new Date(
		Date.UTC(
			Number.parseInt(timestamp.slice(0, 4)),
			Number.parseInt(timestamp.slice(5, 7)) - 1,
			Number.parseInt(timestamp.slice(8, 10)),
			Number.parseInt(timestamp.slice(11, 13)),
			Number.parseInt(timestamp.slice(14, 16)),
			Number.parseInt(timestamp.slice(17, 19)),
		),
	);

	// Format with date and time in user's locale
	return date.toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};
