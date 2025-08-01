import { vi } from "vitest";
import * as sequenceModule from "../../deterministic/sequence.js";
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

		// Mock the nextDeterministicSequenceNumber function
		vi.spyOn(
			sequenceModule,
			"nextDeterministicSequenceNumber"
		).mockImplementation(() => {
			// Use our internal counter instead of calling the real function
			const normalSequence = internalCounter++;

			// Look up the shuffled version, or use original if not in map
			const shuffledSequence =
				shuffleMapping.get(normalSequence) ?? normalSequence;

			return shuffledSequence;
		});

		return lix;
	},
};
