import type { Lix } from "../../lix/open-lix.js";
import type { LixEngine } from "../boot.js";
import { isDeterministicModeSync } from "../deterministic-mode/is-deterministic-mode.js";
import { sql } from "kysely";
import { nextSequenceNumberSync } from "./sequence.js";
import { internalQueryBuilder } from "../internal-query-builder.js";

/**
 * Sync variant of {@link nanoId}. See {@link nanoId} for behavior and examples.
 *
 * @remarks
 * - Accepts `{ engine }` (or `{ lix }` for backward‑compat) and runs next to SQLite.
 * - Intended for engine/router and UDFs; app code should use {@link nanoId}.
 *
 * @see nanoId
 */
export function nanoIdSync(args: {
	engine: Pick<LixEngine, "executeSync" | "hooks" | "runtimeCacheRef">;
	length?: number;
}): string {
	const engine = args.engine;
	// Check if deterministic mode is enabled
	if (isDeterministicModeSync({ engine: engine })) {
		// Check if nano_id is disabled in the config
		const compiled = internalQueryBuilder
			.selectFrom("internal_resolved_state_all")
			.where("entity_id", "=", "lix_deterministic_mode")
			.where("schema_key", "=", "lix_key_value")
			.where("snapshot_content", "is not", null)
			.select(
				sql`json_extract(snapshot_content, '$.value.nano_id')`.as("nano_id")
			)
			.compile();
		const { rows } = engine.executeSync({
			sql: compiled.sql,
			parameters: compiled.parameters,
		});
		const config = rows[0];

		// If nano_id is explicitly set to false, use non-deterministic
		if (config?.nano_id == false) {
			return randomNanoId(args.length);
		}

		// Otherwise use deterministic nano ID
		// Get the next deterministic counter value
		const counter = nextSequenceNumberSync({ engine: engine });
		// Return counter with test_ prefix and padded to 10 digits
		return `test_${counter.toString().padStart(10, "0")}`;
	}

	// Return regular nanoid
	return randomNanoId(args.length);
}

/**
 * Generate a nano ID.
 *
 * Deterministic in deterministic mode; otherwise returns a random 21-character nano ID using the nanoid algorithm.
 *
 * Use nano IDs when IDs will appear in URLs – their shorter length makes links easier to share.
 * For better database performance with time-ordered queries, consider {@link uuidV7} instead.
 *
 * - Normal mode: URL-safe random ID using custom alphabet (no `-` or `_`).
 * - Deterministic mode: "test_" + 10-digit zero-padded counter.
 * - Counter state shared with {@link nextDetermininisticSequenceNumber | nextDeterministicSequenceNumber}.
 * - The "test_" prefix makes deterministic IDs easily identifiable.
 * - Choose nano IDs for URL-friendly short IDs, {@link uuidV7} for time-sortable database keys.
 * - Use the Nano ID collision calculator to choose optimal length.
 *
 * @example Normal mode – random nanoid
 * ```ts
 * const lix = await openLix();
 * const id = await nanoId({ lix }) // "V1StGXR8_Z5jdHi6B-myT"
 * ```
 *
 * @example Deterministic mode – sequential IDs
 * ```ts
 * const lix = await openLix({
 *   keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true }, lixcol_version_id: "global" }]
 * });
 * await nanoId({ lix }) // "test_0000000000"
 * await nanoId({ lix }) // "test_0000000001"
 * await nanoId({ lix }) // "test_0000000002"
 * ```
 *
 * @example Database operations
 * ```ts
 * await lix.db
 *   .insertInto("label")
 *   .values({ id: await nanoId({ lix }), name: "bug", color: "#ff0000" })
 *   .execute();
 * ```
 *
 * @param args.lix Lix instance used to call into the engine.
 * @param args.length Optional length for non-deterministic mode (default: 21)
 */
export async function nanoId(args: {
	// Allow additional properties to avoid excess property errors at call sites
	lix: Pick<Lix, "call"> & Record<string, unknown>;
	length?: number;
}): Promise<string> {
	const res = await args.lix.call("lix_nano_id", { length: args.length });
	return String(res);
}

/**
 * Code taken from the [nanoid](https://github.com/ai/nanoid/blob/main/index.browser.js)
 * browser implementation. The code is licensed under the MIT license.
 *
 */

/**
 * Polyfill for crypto.getRandomValues in environments that don't have it,
 * such as older versions of Node in Stackblitz.
 *
 * This implementation is not cryptographically secure, but is sufficient for ID generation
 * in these environments. In environments with proper crypto support, we'll use the native implementation.
 *
 * See: https://github.com/opral/lix-sdk/issues/258
 */
const insecureRandom = (array: Uint8Array) => {
	for (let i = 0; i < array.length; i++) {
		array[i] = Math.floor(Math.random() * 256);
	}
	return array;
};

// Use crypto.getRandomValues if available, otherwise use our polyfill
const random = (bytes: any) => {
	const array = new Uint8Array(bytes);
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		return crypto.getRandomValues(array);
	}

	// Fallback to insecure random number generator if crypto is not available
	return insecureRandom(array);
};

const customRandom = (
	alphabet: string,
	defaultSize: number,
	getRandom: any
) => {
	// First, a bitmask is necessary to generate the ID. The bitmask makes bytes
	// values closer to the alphabet size. The bitmask calculates the closest
	// `2^31 - 1` number, which exceeds the alphabet size.
	// For example, the bitmask for the alphabet size 30 is 31 (00011111).
	// `Math.clz32` is not used, because it is not available in browsers.
	const mask = (2 << Math.log2(alphabet.length - 1)) - 1;
	// Though, the bitmask solution is not perfect since the bytes exceeding
	// the alphabet size are refused. Therefore, to reliably generate the ID,
	// the random bytes redundancy has to be satisfied.

	// Note: every hardware random generator call is performance expensive,
	// because the system call for entropy collection takes a lot of time.
	// So, to avoid additional system calls, extra bytes are requested in advance.

	// Next, a step determines how many random bytes to generate.
	// The number of random bytes gets decided upon the ID size, mask,
	// alphabet size, and magic number 1.6 (using 1.6 peaks at performance
	// according to benchmarks).

	// `-~f => Math.ceil(f)` if f is a float
	// `-~i => i + 1` if i is an integer
	const step = -~((1.6 * mask * defaultSize) / alphabet.length);

	return (size = defaultSize) => {
		let id = "";
		while (true) {
			const bytes = getRandom(step);
			// A compact alternative for `for (var i = 0; i < step; i++)`.
			let j = step | 0;
			while (j--) {
				// Adding `|| ''` refuses a random byte that exceeds the alphabet size.
				id += alphabet[bytes[j] & mask] || "";
				if (id.length >= size) return id;
			}
		}
	};
};

const customAlphabet = (alphabet: string, size = 21) =>
	customRandom(alphabet, size | 0, random);

/**
 * Uses every character from nano id except for the `-` and `_` character.
 *
 * - Underscore `_` is not URL safe https://github.com/ai/nanoid/issues/347.
 * - Dash `-` breaks selecting the ID from the URL in the browser.
 */
export const _nanoIdAlphabet =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generate secure URL-friendly unique ID.
 *
 * NOTE: This is the non-deterministic version. For deterministic IDs in tests,
 * use `nanoid({ lix })` from './functions.js' instead.
 *
 * Use https://zelark.github.io/nano-id-cc/ to calculate the length
 * of the ID for the use case with the alphabet provided in the
 * implementation.
 */
const randomNanoId: (size?: number) => string = customAlphabet(_nanoIdAlphabet);
