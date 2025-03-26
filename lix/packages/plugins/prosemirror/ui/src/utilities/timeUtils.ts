/**
 * Converts a UTC timestamp to user's local time with a consistent format
 */
export const toUserTime = (timestamp: string): string => {
	// Parse the ISO 8601 date string as UTC
	const date = new Date(timestamp);

	// Format with date and time in user's locale
	// The Date object automatically converts to the user's local timezone when displayed
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
		timeZoneName: "short",
	}).format(date);
};

/**
 * Converts a timestamp to a relative time string (e.g., "2 minutes ago")
 */
export const toRelativeTime = (timestamp: string): string => {
	const date = new Date(timestamp);
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	// Less than 10 seconds
	if (diffInSeconds < 10) {
		return "just now";
	}

	// Less than a minute
	if (diffInSeconds < 60) {
		return "less than 1 min ago";
	}
	// Less than an hour
	if (diffInSeconds < 3600) {
		const minutes = Math.floor(diffInSeconds / 60);
		return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
	}

	// Less than a day
	if (diffInSeconds < 86400) {
		const hours = Math.floor(diffInSeconds / 3600);
		return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
	}

	// Less than a week
	if (diffInSeconds < 604800) {
		const days = Math.floor(diffInSeconds / 86400);
		return `${days} ${days === 1 ? "day" : "days"} ago`;
	}

	// Less than a month (approximation)
	if (diffInSeconds < 2592000) {
		const weeks = Math.floor(diffInSeconds / 604800);
		return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
	}

	// Less than a year (approximation)
	if (diffInSeconds < 31536000) {
		const months = Math.floor(diffInSeconds / 2592000);
		return `${months} ${months === 1 ? "month" : "months"} ago`;
	}

	// More than a year
	const years = Math.floor(diffInSeconds / 31536000);
	return `${years} ${years === 1 ? "year" : "years"} ago`;
};
