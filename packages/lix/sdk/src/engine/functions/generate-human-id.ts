import type { Lix } from "../../lix/open-lix.js";
import type { LixEngine } from "../boot.js";
import { isDeterministicModeSync } from "../deterministic-mode/is-deterministic-mode.js";
import { nextSequenceNumberSync } from "./sequence.js";
import { randomSync } from "./random.js";
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

const RANDOM_ADJECTIVES = [
	"amber",
	"artful",
	"blithe",
	"bold",
	"brisk",
	"calm",
	"cobalt",
	"crisp",
	"daring",
	"deft",
	"dusky",
	"eager",
	"electric",
	"emerald",
	"fabled",
	"feathered",
	"frosted",
	"gentle",
	"gilded",
	"gleaming",
	"glowing",
	"honeyed",
	"hushed",
	"icy",
	"illustrated",
	"iridescent",
	"jaunty",
	"jovial",
	"keen",
	"lucid",
	"luminous",
	"magnetic",
	"mellow",
	"misty",
	"nimble",
	"northern",
	"novel",
	"opal",
	"onyx",
	"plucky",
	"polished",
	"prismatic",
	"quaint",
	"quivering",
	"quiet",
	"radiant",
	"restful",
	"rustic",
	"shimmering",
	"silken",
	"spry",
	"sunlit",
	"tender",
	"tranquil",
	"verdant",
	"verdigris",
	"violet",
	"whimsical",
	"windborne",
	"woven",
	"zen",
	"zesty",
];

const RANDOM_NOUNS = [
	"acorn",
	"anchor",
	"aurora",
	"banyan",
	"beacon",
	"blossom",
	"boulder",
	"bracken",
	"breeze",
	"brook",
	"cairn",
	"canopy",
	"canyon",
	"cascade",
	"cedar",
	"celeste",
	"chisel",
	"cinder",
	"cirrus",
	"comet",
	"copper",
	"coral",
	"cosmos",
	"crest",
	"cricket",
	"crystal",
	"dahlia",
	"delta",
	"dune",
	"echo",
	"ember",
	"falcon",
	"feather",
	"flare",
	"flint",
	"forest",
	"frost",
	"galaxy",
	"glade",
	"glacier",
	"glow",
	"grove",
	"harbor",
	"harvest",
	"horizon",
	"iris",
	"isle",
	"ivory",
	"jade",
	"juniper",
	"lagoon",
	"lark",
	"lattice",
	"lumen",
	"marble",
	"meadow",
	"meteor",
	"mirage",
	"mist",
	"nimbus",
	"oak",
	"obsidian",
	"ocean",
	"orbit",
	"otter",
	"pine",
	"plume",
	"prairie",
	"quartz",
	"quill",
	"raven",
	"reef",
	"ripple",
	"river",
	"saffron",
	"sapphire",
	"shadow",
	"shore",
	"signal",
	"solace",
	"spark",
	"sprout",
	"starling",
	"stone",
	"summit",
	"sunrise",
	"sycamore",
	"thimble",
	"thistle",
	"tide",
	"timber",
	"torrent",
	"trill",
	"vale",
	"velvet",
	"vessel",
	"violet",
	"willow",
	"wind",
	"wisp",
	"zephyr",
	"zenith",
];

const RANDOM_NUMERIC_SUFFIX_SIZE = 1000;
const NUMERIC_PROBABILITY_BUCKET = 10;
const NUMERIC_PROBABILITY_THRESHOLD = 3; // ≈30% chance to append a numeric suffix

function drawRandomInt({
	size,
	engine,
}: {
	size: number;
	engine?: Pick<LixEngine, "executeSync" | "hooks" | "runtimeCacheRef">;
}): number {
	if (size <= 0) {
		throw new Error("Size must be positive to draw a random integer");
	}

	const entropy = 0x1_0000_0000;
	if (size >= entropy) {
		const fallback = engine ? randomSync({ engine }) : Math.random();
		return Math.floor(fallback * size);
	}

	const limit = entropy - (entropy % size);
	while (true) {
		const source = engine ? randomSync({ engine }) : Math.random();
		const sample = Math.floor(source * entropy);
		if (sample < limit) {
			return sample % size;
		}
	}
}

function formatWord(word: string, capitalize: boolean): string {
	const lower = word.toLowerCase();
	if (!capitalize) {
		return lower;
	}
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function randomName({
	capitalize,
	engine,
	separator,
}: {
	capitalize: boolean;
	engine?: Pick<LixEngine, "executeSync" | "hooks" | "runtimeCacheRef">;
	separator: string;
}): string {
	const adjective =
		RANDOM_ADJECTIVES[
			drawRandomInt({ size: RANDOM_ADJECTIVES.length, engine })
		]!;
	const noun =
		RANDOM_NOUNS[drawRandomInt({ size: RANDOM_NOUNS.length, engine })]!;

	const components = [
		formatWord(adjective, capitalize),
		formatWord(noun, capitalize),
	];

	const shouldAppendNumber =
		drawRandomInt({ size: NUMERIC_PROBABILITY_BUCKET, engine }) <
		NUMERIC_PROBABILITY_THRESHOLD;
	if (shouldAppendNumber) {
		const suffix = drawRandomInt({
			size: RANDOM_NUMERIC_SUFFIX_SIZE,
			engine,
		});
		components.push(String(suffix));
	}

	if (separator === "") {
		return components.join("");
	}
	return components.join(separator);
}

/**
 * @internal
 * Generates a human readable word for anonymous IDs using non-deterministic randomness.
 *
 * @example
 * const lowercase = randomHumanIdWord({ capitalize: false });
 */
export function randomHumanIdWord(options?: {
	capitalize?: boolean;
	engine?: Pick<LixEngine, "executeSync" | "hooks" | "runtimeCacheRef">;
	separator?: string;
}): string {
	const separator = options?.separator ?? "_";
	return randomName({
		capitalize: options?.capitalize ?? true,
		engine: options?.engine,
		separator,
	});
}

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
	engine: Pick<LixEngine, "hooks" | "executeSync" | "runtimeCacheRef">;
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
		return randomHumanIdWord({
			capitalize,
			engine: args.engine,
			separator,
		});
	}
}

/**
 * Generate a human-readable ID.
 *
 * Deterministic in deterministic mode; otherwise selects from a curated random vocabulary.
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
