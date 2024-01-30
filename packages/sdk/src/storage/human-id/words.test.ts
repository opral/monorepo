import { describe, it, expect } from "vitest"
import { adjectives, animals, adverbs, verbs } from "./words.js"

const wordlists = [adjectives, animals, adverbs, verbs]
const allwords = [...adjectives, ...animals, ...adverbs, ...verbs]

// TODO: test for legal characters

describe("wordlists", () => {
	it("should have 256 words", () => {
		for (const wordlist of wordlists) {
			expect(wordlist.length).toBe(256)
		}
	})
	it("should have unique words across lists", () => {
		const unique = new Set(allwords)
		expect(unique.size).toBe(256 * 4)
	})
	it("the longest word should have <= 10 characters", () => {
		let maxlen = 0
		for (const word of allwords) {
			maxlen = Math.max(maxlen, word.length)
		}
		expect(maxlen).toBeLessThanOrEqual(10)
	})
})
