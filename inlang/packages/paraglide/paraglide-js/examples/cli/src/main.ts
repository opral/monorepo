import * as assert from "node:assert";
import { m } from "./paraglide/messages.js";
import { setLocale } from "./paraglide/runtime.js";
import { test } from "node:test";

test("should log the messages in the correct locale", async () => {
	setLocale("en");

	assert.strictEqual(
		m.blue_horse_shoe({ username: "Samuel", placename: "Berlin" }),
		"Hello Samuel! Welcome to Berlin."
	);

	setLocale("de");
	assert.strictEqual(
		m.blue_horse_shoe({ username: "Anna", placename: "New York City" }),
		"Hallo Anna! Willkommen in New York City."
	);
});

test("matching should work", async () => {
	setLocale("en");
	assert.strictEqual(
		m.jojo_mountain_day({
			platform: "android",
			username: "Samuel",
			userGender: "male",
		}),
		"Samuel has to download the app on his phone from the Google Play Store."
	);

	assert.strictEqual(
		m.jojo_mountain_day({
			platform: "someting",
			userGender: "other",
			username: "unknown",
		}),
		"The person has to download the app."
	);
});

test("defining a locale as option should work ", async () => {
	setLocale("en");
	assert.strictEqual(
		m.blue_horse_shoe(
			{ username: "Samuel", placename: "Berlin" },
			{ locale: "de" }
		),
		"Hallo Samuel! Willkommen in Berlin."
	);
});

test("paraglide falls back to parent locale", async () => {
	setLocale("en-US");

	assert.strictEqual(
		m.blue_horse_shoe({ username: "Samuel", placename: "Berlin" }),
		"Hello Samuel! Welcome to the USA."
	);
	// doesn't exist in en-US but en
	assert.strictEqual(m.simple(), "This is a simple message.");
});

test("nesting works", async () => {
	setLocale("en");
	assert.strictEqual(
		m["nesting.level1.level2.level3"]({
			username: "Samuel",
			placename: "Berlin",
		}),
		"This is a nested message."
	);
});