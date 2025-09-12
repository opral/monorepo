import type { Lix } from "../../lix/open-lix.js";
import type { Call } from "../router.js";
import type { LixRuntime } from "../boot.js";
import { isDeterministicModeSync } from "./is-deterministic-mode.js";
import { nextSequenceNumberSync } from "./sequence.js";
import { humanId as _human } from "human-id";
// Deterministic names for anonymous accounts
const DETERMINISTIC_NAMES = [
	"Plum",
	"Coin",
	"Bird",
	"Fish",
	"Tree",
	"Star",
	"Moon",
	"Sun",
	"Wave",
	"Rock",
	"Fox",
	"Bear",
	"Wolf",
	"Lion",
	"Eagle",
	"Hawk",
	"Dove",
	"Swan",
	"Crow",
	"Owl",
	"Rose",
	"Lily",
	"Iris",
	"Sage",
	"Mint",
	"Fern",
	"Palm",
	"Oak",
	"Pine",
	"Elm",
	"Gold",
	"Ruby",
	"Pearl",
	"Jade",
	"Opal",
	"Onyx",
	"Zinc",
	"Iron",
	"Clay",
	"Sand",
	"Maple",
	"Cedar",
	"Birch",
	"Willow",
	"Aspen",
	"Beech",
	"Ash",
	"Alder",
	"Bamboo",
	"Coral",
];

// Expose vocabulary size for tests that assert cycling behavior
export function deterministicHumanIdVocabularySize(): number {
	return DETERMINISTIC_NAMES.length;
}

/**
 * Sync variant of {@link humanId}. See {@link humanId} for behavior and examples.
 *
 * @remarks
 * - Accepts `{ runtime }` (or `{ lix }`) and runs next to SQLite.
 * - Intended for runtime/router and UDFs; app code should use {@link humanId}.
 *
 * @see humanId
 */
export function humanIdSync(
	args:
		| {
				lix: Pick<Lix, "sqlite" | "db" | "hooks">;
				separator?: string;
				capitalize?: boolean;
		  }
		| { runtime: LixRuntime; separator?: string; capitalize?: boolean }
): string {
	const capitalize = args.capitalize ?? true;
	const separator = args.separator ?? "_";

	const lix =
		"runtime" in args
			? {
					sqlite: args.runtime.sqlite,
					db: args.runtime.db,
					hooks: args.runtime.hooks,
				}
			: args.lix;

	if (isDeterministicModeSync({ lix })) {
		// In deterministic mode, use sequence to get deterministic index
		const sequence = nextSequenceNumberSync({ lix });

		// Use modulo to cycle through names
		const name = DETERMINISTIC_NAMES[sequence % DETERMINISTIC_NAMES.length]!;
		return capitalize ? name : name.toLowerCase();
	} else {
		// In non-deterministic mode, use human-id library
		const name = _human({
			capitalize: capitalize,
			adjectiveCount: 0,
			separator: separator,
		})
			// Human ID has two words, remove the last one
			.split(separator)[0]!
			// Human ID uses plural, remove the last character to make it singular
			.slice(0, -1);

		return name;
	}
}

/**
 * Generate a human-readable ID.
 *
 * Deterministic in deterministic mode; otherwise uses random human-id.
 *
 * @example
 * const name = await humanId({ lix })
 */
export async function humanId(args: {
	lix: { call: Call };
	separator?: string;
	capitalize?: boolean;
}): Promise<string> {
	const res = await args.lix.call("lix_human_id", {
		separator: args.separator,
		capitalize: args.capitalize,
	});
	return String(res);
}
