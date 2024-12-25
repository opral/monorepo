/* eslint-disable no-undef */
/* eslint-disable no-console */
import * as m from "./paraglide/messages.js";
import { setLocale } from "./paraglide/runtime.js";
import { test, expect } from "vitest";

test("should log the messages in the correct locale", async () => {
  setLocale("en");

  expect(m.blue_horse_shoe({ username: "Samuel", placename: "Berlin" })).toBe(
    "Hello Samuel! Welcome to Berlin.",
  );

  setLocale("de");

  expect(
    m.blue_horse_shoe({ username: "Anna", placename: "New York City" }),
  ).toBe("Hallo Anna! Du bist in New York City.");
});

test("matching should work", async () => {
  expect(
    m.jojo_mountain_day({
      platform: "android",
      username: "Samuel",
      userGender: "male",
    }),
  ).toBe(
    "Samuel has to download the app on his phone from the Google Play Store.",
  );

  expect(
    m.jojo_mountain_day({
      platform: "someting",
      userGender: "other",
      username: "unknown",
    }),
  ).toBe("The person has to download the app.");
});

test("defining a locale as option should work ", async () => {
  setLocale("en");
  expect(
    m.blue_horse_shoe(
      { username: "Samuel", placename: "Berlin" },
      { locale: "de" },
    ),
  ).toBe("Hallo Samuel! Willkommen in Berlin.");
});

test("paraglide falls back to parent locale", async () => {
  setLocale("en-US");

  expect(m.blue_horse_shoe({ username: "Samuel", placename: "Berlin" })).toBe(
    "Hallo Samuel! Welcome to the USA.",
  );
  // doesn't exist in en-US but en
  expect(m.simple()).toBe("This is a simple message.");
});
