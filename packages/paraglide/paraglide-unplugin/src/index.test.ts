import { describe, it, expect } from "vitest"
import { hashMessages } from "./index.js"
import type { Message, ProjectSettings } from "@inlang/sdk"

describe("hashMessages", () => {
	it("should return the same hash for the same set of messages", () => {
		const messages1: Message[] = [
			{ id: "foo", alias: {}, variants: [], selectors: [] },
			{ id: "bar", alias: {}, variants: [], selectors: [] },
		]

		const messages2: Message[] = [
			{ id: "bar", alias: {}, variants: [], selectors: [] },
			{ id: "foo", alias: {}, variants: [], selectors: [] },
		]

		const settings: ProjectSettings = { modules: [], languageTags: [], sourceLanguageTag: "en" }

		expect(hashMessages(messages1, settings)).toBe(hashMessages(messages2, settings))
	})

	it("should return the same hash even if variants aren't in the same order", () => {
		const messages1: Message[] = [
			{
				id: "foo",
				alias: {},
				variants: [
					{
						languageTag: "en",
						match: [],
						pattern: [],
					},
					{
						languageTag: "de",
						match: [],
						pattern: [],
					},
				],
				selectors: [],
			},
		]

		const messages2: Message[] = [
			{
				id: "foo",
				alias: {},
				variants: [
					{
						languageTag: "de",
						match: [],
						pattern: [],
					},
					{
						languageTag: "en",
						match: [],
						pattern: [],
					},
				],
				selectors: [],
			},
		]

		const settings: ProjectSettings = { modules: [], languageTags: [], sourceLanguageTag: "en" }

		expect(hashMessages(messages1, settings)).toBe(hashMessages(messages2, settings))
	})
})
