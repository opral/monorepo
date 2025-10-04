import { vi } from "vitest";
import * as tsModule from "../../engine/functions/timestamp.js";
import type { SimulationTestDef } from "./simulation-test.js";

/**
 * Out-of-order sequence simulation - Returns shuffled sequence numbers
 * to ensure queries don't rely on ordered IDs or timestamps.
 *
 * This simulation shuffles sequence numbers to catch any code that incorrectly
 * assumes monotonic ordering of IDs, timestamps, or other sequence-based values.
 */
export const outOfOrderSequenceSimulation: SimulationTestDef = {
	name: "out-of-order-sequence",
	setup: async (lix) => {
		// Simple deterministic shuffle function using fixed seed
		const createShuffledMapping = (
			maxSequences: number
		): Map<number, number> => {
			const normalSequence = Array.from({ length: maxSequences }, (_, i) => i);
			const shuffledSequence = [...normalSequence];

			// Deterministic shuffle with fixed seed
			let seed = 12345;
			const random = () => {
				seed = (seed * 9301 + 49297) % 233280;
				return seed / 233280;
			};

			for (let i = shuffledSequence.length - 1; i > 0; i--) {
				const j = Math.floor(random() * (i + 1));
				const temp = shuffledSequence[i]!;
				shuffledSequence[i] = shuffledSequence[j]!;
				shuffledSequence[j] = temp;
			}

			// Create mapping from normal to shuffled
			const mapping = new Map<number, number>();
			for (let i = 0; i < normalSequence.length; i++) {
				mapping.set(normalSequence[i]!, shuffledSequence[i]!);
			}

			return mapping;
		};

		// Pre-generate mapping for first 1000 sequence numbers
		const shuffleMapping = createShuffledMapping(1000);

		// Internal counter to track what the "normal" sequence would be
		// This avoids calling the real sequence function which would change database state
		let internalCounter = 0;

		// Mock the async getTimestamp to return shuffled timestamps
		vi.spyOn(tsModule, "getTimestamp").mockImplementation(async () => {
			const normal = internalCounter++;
			const shuffled = shuffleMapping.get(normal) ?? normal;
			return new Date(shuffled).toISOString();
		});

		return lix;
	},
};
