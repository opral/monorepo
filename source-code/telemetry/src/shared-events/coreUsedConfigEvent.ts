import type { InlangConfig } from "@inlang/core/config"

/**
 * Captures the config after set up.
 *
 * Config information provides us insights into questions like:
 *
 * - How many users use which plugins?
 * - What lint rules are most commonly used?
 * - What is the most common config?
 *
 * The answers to those questions helps us prioritize the roadmap and
 * ultimately build a better product.
 *
 */
export const coreUsedConfigEvent = {
	name: "Ecosystem used config" as const,
	// typesafe properties
	properties: (config: InlangConfig) => config,
}
