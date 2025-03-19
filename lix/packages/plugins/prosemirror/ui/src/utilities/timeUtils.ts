/**
 * Converts a UTC timestamp to user's local time with a consistent format
 */
export const toUserTime = (timestamp: string): string => {
	// Use the native Date constructor for parsing ISO 8601 dates
	const date = new Date(timestamp);

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
