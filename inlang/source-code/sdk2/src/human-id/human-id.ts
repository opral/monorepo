// we use murmur for best distribution https://medium.com/miro-engineering/choosing-a-hash-function-to-solve-a-data-sharding-problem-c656259e2b54
import murmurhash3 from "murmurhash3js";
import { adjectives, animals, verbs, adverbs } from "./words.js";

export function humanId() {
	return `${adjectives[Math.floor(Math.random() * 256)]}_${
		adjectives[Math.floor(Math.random() * 256)]
	}_${animals[Math.floor(Math.random() * 256)]}_${
		verbs[Math.floor(Math.random() * 256)]
	}`;
}

export function isHumanId(id: string): boolean {
	// naive implementation (good enough for now)
	return id.split("_").length === 4;
}

/**
 * The function generated a stable bundle id based on the input value.
 *
 * @example
 *   stableHumanId("login-button-header") // => "..."
 *
 */
export function stableHumanId(value: string, offset: number = 0) {
	// Seed value can be any arbitrary value
	const seed = 42;

	// Use MurmurHash3 to produce a 32-bit hash
	const hash32 = murmurhash3.x86.hash32(value, seed);
	// Add 1 and take modulo 2^32 to fit within 32 bits
	const hash32WithOffset: number = (hash32 + offset) >>> 0;

	// Extract four 8-bit parts
	const part1 = (hash32WithOffset >>> 24) & 0xff;
	const part2 = (hash32WithOffset >>> 16) & 0xff;
	const part3 = (hash32WithOffset >>> 8) & 0xff;
	const part4 = hash32WithOffset & 0xff;

	return `${adjectives[part1]}_${animals[part2]}_${verbs[part3]}_${adverbs[part4]}`;
}
