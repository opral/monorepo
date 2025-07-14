import { expect, test, vi } from "vitest";
import { _nanoIdAlphabet, randomNanoId } from "./nano-id.js";

test("length is obeyed", () => {
	const id = randomNanoId(10);
	expect(id.length).toBe(10);
});

test("the alphabet does not contain underscores `_` because they are not URL safe", () => {
	expect(_nanoIdAlphabet).not.toContain("_");
});

test("the alphabet does not contain dashes `-` because they break selecting the ID from the URL in the browser", () => {
	expect(_nanoIdAlphabet).not.toContain("-");
});

/**
 * Test the crypto polyfill that was added to fix environments without crypto support
 * like older versions of Node in Stackblitz.
 *
 * See: https://github.com/opral/lix-sdk/issues/258
 */
test("polyfill works when crypto is not available", () => {
	// Store original crypto
	const originalCrypto = global.crypto;

	// Mock crypto as undefined to test the polyfill
	vi.stubGlobal("crypto", undefined);

	try {
		const id = randomNanoId(10);
		expect(id.length).toBe(10);
		expect(typeof id).toBe("string");
		// Check that it only contains characters from our alphabet
		for (let i = 0; i < id.length; i++) {
			expect(_nanoIdAlphabet).toContain(id[i]);
		}
	} finally {
		// Restore original crypto
		vi.stubGlobal("crypto", originalCrypto);
	}
});
