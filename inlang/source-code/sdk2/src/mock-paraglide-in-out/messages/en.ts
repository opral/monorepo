import { double, format_date, plural, type Gender } from "../registry.js";

export function happy_hippo_sky(inputs: {
	username: string;
	userGender: Gender;
	time: string;
	photoCount: number;
}) {
	const { username, userGender, photoCount, time } = inputs;

	const doublePhotoCount = double(photoCount);

	if (plural("en", photoCount) === "one" && userGender === "male") {
		return `${username} added a new photo to his stream.`;
	}
	if (plural("en", photoCount) === "one" && userGender === "female") {
		return `${username} added a new photo to her stream.`;
	}
	if (plural("en", photoCount) === "one") {
		return `${username} added a new photo to their stream.`;
	}
	if (userGender === "male") {
		return `${username} added ${photoCount} new photos to his stream.`;
	}
	if (userGender === "female") {
		return `${username} added ${photoCount} new photos to her stream.`;
	}
	return `${username} added ${photoCount} new photos to their stream ${format_date(
		time,
		{ show: "day" }
	)}.`;
}
