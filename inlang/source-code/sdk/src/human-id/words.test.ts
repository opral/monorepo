import { describe, it, expect } from "vitest";
import { adjectives, animals, adverbs, verbs } from "./words.js";

const wordlists = [adjectives, animals, adverbs, verbs];
const allwords = [...adjectives, ...animals, ...adverbs, ...verbs];

describe("wordlists", () => {
	it("should have 256 words", () => {
		for (const wordlist of wordlists) {
			expect(wordlist.length).toBe(256);
		}
	});
	it("words should be unique across lists", () => {
		const unique = new Set(allwords);
		expect(unique.size).toBe(256 * 4);
	});
	it("words should have < 10 characters", () => {
		for (const word of allwords) {
			expect(word.length).toBeLessThan(10);
		}
	});
	it("words should match /^[a-z]+$/", () => {
		for (const word of allwords) {
			expect(word.match(/^[a-z]+$/) !== null).toBe(true);
		}
	});
});
