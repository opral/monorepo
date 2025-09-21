import type { SqliteWasmDatabase } from "../../database/sqlite/index.js";
import { sql, type Kysely } from "kysely";
import { executeSync } from "../../database/execute-sync.js";
import { LixKeyValueSchema, type LixKeyValue } from "../../key-value/schema.js";
import type { Lix } from "../../lix/open-lix.js";
import type { LixEngine } from "../boot.js";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { isDeterministicModeSync } from "./is-deterministic-mode.js";
import { getTimestampSync } from "./timestamp.js";
import { updateUntrackedState } from "../../state/untracked/update-untracked-state.js";

/** State kept per SQLite connection - 16 bytes for xorshift128+ */
type RngState = {
	hi: bigint;
	lo: bigint;
	dirty: boolean;
};

const rngCache = new WeakMap<SqliteWasmDatabase, RngState>();

/**
 * Non-deterministic random number generator using crypto.getRandomValues().
 * Returns a 53-bit precision float in [0, 1).
 */
function randomUnstable(): number {
	const buf = new Uint32Array(2);
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		crypto.getRandomValues(buf);
	} else {
		// Fallback for environments without crypto API
		// This is not cryptographically secure but better than failing
		buf[0] = Math.floor(Math.random() * 0xffffffff);
		buf[1] = Math.floor(Math.random() * 0xffffffff);
	}
	// 53-bit float in [0,1) - standard technique for full precision
	const high = buf[0]! >>> 5; // 27 bits
	const low = buf[1]! >>> 6; // 26 bits
	// Combine to get 53 bits total, then divide by 2^53
	return (high * 0x4000000 + low) / Math.pow(2, 53);
}

/**
 * Sync variant of {@link random}. See {@link random} for behavior and examples.
 *
 * @remarks
 * - Accepts `{ engine }` (or `{ lix }`) and runs next to SQLite.
 * - Intended for engine/router and UDFs; app code should use {@link random}.
 *
 * @see random
 */
export function randomSync(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
}): number {
	const engine = args.engine;
	// Non-deterministic mode: use crypto.getRandomValues()
	if (!isDeterministicModeSync({ engine })) {
		return randomUnstable();
	}

	// Deterministic mode: use xorshift128+
	let state = rngCache.get(engine.sqlite);

	/* First use on this connection → initialize from seed */
	if (!state) {
		// Check if we have persisted RNG state
		const [stateRow] = executeSync({
			engine,
			query: engine.db
				.selectFrom("key_value_all")
				.where("key", "=", "lix_deterministic_rng_state")
				.where("lixcol_version_id", "=", "global")
				.select("value"),
		});

		if (stateRow && stateRow.value) {
			// Restore persisted state
			// The value is stored as a JSON string in key_value_all view
			const stateData =
				typeof stateRow.value === "string"
					? JSON.parse(stateRow.value)
					: stateRow.value;

			// Handle both string and direct values
			state = {
				hi: BigInt(stateData.hi),
				lo: BigInt(stateData.lo),
				dirty: false,
			};
		} else {
			// Initialize from seed
			const seed = getRngSeed({ engine });
			state = seedXorshift128Plus(seed);
		}

		rngCache.set(engine.sqlite, state);
	}

	// Generate next random value using xorshift128+
	const result = nextXorshift128Plus(state);
	state.dirty = true;
	return result;
}

/**
 * Get the RNG seed - either from deterministic mode config or derive from lix_id
 */
function getRngSeed(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
}): string {
	// Check for seed in the deterministic mode config
	const [configRow] = executeSync({
		engine: args.engine,
		query: (args.engine.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.selectFrom("internal_resolved_state_all")
			.where("entity_id", "=", "lix_deterministic_mode")
			.where("schema_key", "=", "lix_key_value")
			.where("snapshot_content", "is not", null)
			.select(
				sql`json_extract(snapshot_content, '$.value.random_seed')`.as(
					"random_seed"
				)
			),
	});

	if (configRow && configRow.random_seed) {
		return configRow.random_seed as string;
	}

	// Derive default seed from lix_id
	const [idRow] = executeSync({
		engine: args.engine,
		query: args.engine.db
			.selectFrom("key_value")
			.where("key", "=", "lix_id")
			.select("value"),
	});

	if (!idRow || !idRow.value) {
		throw new Error("Could not find lix_id for RNG seed");
	}

	// Use lix_id as the seed - no need to insert it
	return idRow.value as string;
}

/**
 * Initialize state from a 64-bit hash of the seed string (SplitMix64-style)
 */
function seedXorshift128Plus(seed: string): RngState {
	// FNV-1a hash to get initial value
	let z = 0xcbf29ce484222325n;
	for (const ch of seed) {
		z = ((z ^ BigInt(ch.charCodeAt(0))) * 0x100000001b3n) & 0xffffffffffffffffn;
	}

	// SplitMix64 to expand into two non-zero words
	const next = (): bigint => {
		z = (z + 0x9e3779b97f4a7c15n) & 0xffffffffffffffffn;
		let t = z;
		t = ((t ^ (t >> 30n)) * 0xbf58476d1ce4e5b9n) & 0xffffffffffffffffn;
		t = ((t ^ (t >> 27n)) * 0x94d049bb133111ebn) & 0xffffffffffffffffn;
		return t ^ (t >> 31n);
	};

	return {
		hi: next() || 1n,
		lo: next() || 2n,
		dirty: true, // New seed always needs to be persisted
	};
}

/**
 * One xorshift128+ step → returns 53-bit float in [0,1)
 * This is the same algorithm used by V8/Chrome for Math.random()
 */
function nextXorshift128Plus(state: RngState): number {
	let s1 = state.lo;
	const s0 = state.hi;
	state.lo = s0;
	s1 ^= (s1 << 23n) & 0xffffffffffffffffn;
	state.hi = (s1 ^ s0 ^ (s1 >> 17n) ^ (s0 >> 26n)) & 0xffffffffffffffffn;
	const sum = (state.hi + state.lo) & 0xffffffffffffffffn;
	// 53 high bits → IEEE-754 double in [0,1)
	return Number(sum >> 11n) / Math.pow(2, 53);
}

/**
 * @internal
 * Flush the in-memory RNG state to persistent storage.
 *
 * Called automatically by Lix after each committing write and during
 * `lix.toBlob()` / `lix.close()`. **Not part of the public API.**
 */
export function commitDeterministicRngState(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
	timestamp?: string;
}): void {
	const engine = args.engine;
	const state = rngCache.get(engine.sqlite);
	if (!state || !state.dirty) return; // nothing to do

	state.dirty = false; // mark clean _before_ we try to write

	const newValue = JSON.stringify({
		key: "lix_deterministic_rng_state",
		value: {
			hi: state.hi.toString(),
			lo: state.lo.toString(),
		},
	} satisfies LixKeyValue);

	const now = args.timestamp ?? getTimestampSync({ engine });
	updateUntrackedState({
		engine: engine,
		changes: [
			{
				entity_id: "lix_deterministic_rng_state",
				schema_key: LixKeyValueSchema["x-lix-key"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: newValue,
				schema_version: LixKeyValueSchema["x-lix-version"],
				created_at: now,
				lixcol_version_id: "global",
			},
		],
	});
}

/**
 * Returns a random float between 0 (inclusive) and 1 (exclusive).
 *
 * In deterministic mode, generates reproducible values using xorshift128+ PRNG
 * (the same algorithm used by V8/Chrome for Math.random()). In normal mode, uses crypto.getRandomValues().
 *
 * - Normal mode: cryptographic quality via crypto.getRandomValues().
 * - Deterministic mode: xorshift128+ PRNG (same as V8/Chrome's Math.random()).
 * - Default seed: `lix_id` unless `lix_deterministic_rng_seed` is set.
 * - State persisted via `lix_deterministic_rng_state`.
 * - Returns 53-bit precision floats in both modes.
 * - For ID generation, consider {@link uuidV7} or {@link nanoId} instead.
 *
 * @example Normal mode – cryptographically secure randomness
 * ```ts
 * const lix = await openLix();
 * const r1 = await random({ lix }) // 0.823...
 * const r2 = await random({ lix }) // 0.156...
 * ```
 *
 * @example Deterministic mode – reproducible randomness
 * ```ts
 * const lix = await openLix({ keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }] });
 * await random({ lix }) // 0.318...
 * await random({ lix }) // 0.937...
 * await random({ lix }) // 0.543...
 * ```
 */
export async function random(args: {
	lix: Pick<Lix, "call">;
}): Promise<number> {
	const res = await args.lix.call("lix_random");
	return Number(res);
}
