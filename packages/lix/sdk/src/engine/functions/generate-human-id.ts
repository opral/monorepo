import type { Lix } from "../../lix/open-lix.js";
import type { LixEngine } from "../boot.js";
import { isDeterministicModeSync } from "../deterministic-mode/is-deterministic-mode.js";
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
 * - Accepts `{ engine }` (or `{ lix }`) and runs next to SQLite.
 * - Intended for engine/router and UDFs; app code should use {@link humanId}.
 *
 * @see humanId
 */
export function humanIdSync(args: {
	engine: Pick<
		LixEngine,
		"hooks" | "runtimeCacheRef" | "executeQuerySync" | "executeSync"
	>;
	separator?: string;
	capitalize?: boolean;
}): string {
	const capitalize = args.capitalize ?? true;
	const separator = args.separator ?? "_";

	if (isDeterministicModeSync({ engine: args.engine })) {
		// In deterministic mode, use sequence to get deterministic index
		const sequence = nextSequenceNumberSync({ engine: args.engine });

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
	lix: Lix;
	separator?: string;
	capitalize?: boolean;
}): Promise<string> {
	const res = await args.lix.call("lix_human_id", {
		separator: args.separator,
		capitalize: args.capitalize,
	});
	return String(res);
}
