import type { Lix } from "../lix/open-lix.js";
import { isDeterministicMode } from "./is-deterministic-mode.js";
import { nextDeterministicSequenceNumber } from "./sequence.js";
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
];

/**
 * Generates a human-readable ID that is deterministic in deterministic mode.
 *
 * @example
 * ```ts
 * const name = generateHumanId({ lix });
 * // In deterministic mode: returns deterministic names like "Plum", "Coin", etc.
 * // In normal mode: returns random human-id names
 *
 * const lowercaseName = generateHumanId({ lix, capitalize: false });
 * // Returns lowercase names like "plum", "coin", etc.
 * ```
 */
export function generateHumanId(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	separator?: string;
	capitalize?: boolean;
}): string {
	const capitalize = args.capitalize ?? true;
	const separator = args.separator ?? "_";

	if (isDeterministicMode({ lix: args.lix })) {
		// In deterministic mode, use sequence to get deterministic index
		const sequence = nextDeterministicSequenceNumber({
			lix: args.lix,
		});

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
