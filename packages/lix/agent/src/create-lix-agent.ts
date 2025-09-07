import type { Lix } from "@lix-js/sdk";
import type { LanguageModelV2 } from "@ai-sdk/provider";

/**
 * Placeholder for the Lix agent.
 *
 * v0 will start with: "Describe my working changes".
 * The real implementation will land behind this API.
 *
 * @example
 * import { createLixAgent } from "@lix-js/agent";
 * const agent = createLixAgent({ lix });
 * // Throws: not implemented yet
 */
export type LixAgent = { lix: Lix; model: LanguageModelV2 };

/**
 * Create a minimal Lix agent handle.
 *
 * Wraps the Lix instance and optionally a LanguageModelV2 to be used by
 * higher-level helpers (e.g., summarizeWorkingChanges({ agent })) when
 * generating natural-language output.
 */
export async function createLixAgent(args: {
	lix: Lix;
	model: LanguageModelV2;
}): Promise<LixAgent> {
	const { lix, model } = args;
	return { lix, model };
}
