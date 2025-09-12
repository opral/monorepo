import type { Lix } from "../../lix/open-lix.js";
import type { LixRuntime } from "../boot.js";
import { isDeterministicModeSync } from "./is-deterministic-mode.js";
import { nextSequenceNumberSync } from "./sequence.js";
import { humanId } from "human-id";
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
 * Generates a human-readable ID that is deterministic in deterministic mode.
 *
 * @example
 * ```ts
 * const name = humanIdSync({ lix });
 * // In deterministic mode: returns deterministic names like "Plum", "Coin", etc.
 * // In normal mode: returns random human-id names
 *
 * const lowercaseName = humanIdSync({ lix, capitalize: false });
 * // Returns lowercase names like "plum", "coin", etc.
 * ```
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
		const name = humanId({
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
