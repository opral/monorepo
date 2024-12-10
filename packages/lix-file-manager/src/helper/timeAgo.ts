function timeAgo(dateString: string): string {
	// Get the current time in GMT
	const now = new Date(new Date().toLocaleString("en", { timeZone: "GMT" }));
	// Parse the provided date string into a Date object
	const pastDate = new Date(dateString);

	// Calculate the difference in seconds between the current time and the past date
	const secondsAgo = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

	// Define the time intervals in seconds
	const intervals: { [key: string]: number } = {
		year: 31536000,
		month: 2592000,
		week: 604800,
		day: 86400,
		hour: 3600,
		minute: 60,
		second: 1,
	};

	// Handle the special case for "a few seconds ago"
	if (secondsAgo < intervals.minute) {
		return "a few seconds ago";
	}

	// Loop through the intervals and determine the appropriate time unit
	for (const [unit, secondsInUnit] of Object.entries(intervals)) {
		const interval = Math.floor(secondsAgo / secondsInUnit);
		if (interval >= 1) {
			if (unit === "year") {
				// If the interval is greater than or equal to 1 year, format the date as "DD, Month YYYY"
				const formattedDate = pastDate.toLocaleDateString("en", {
					day: "numeric",
					month: "long",
					year: "numeric",
				});
				return formattedDate;
			} else {
				// For other intervals, return the time ago string
				return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
			}
		}
	}

	// If the time difference is less than a second, return "just now"
	return "just now";
}

export default timeAgo;
