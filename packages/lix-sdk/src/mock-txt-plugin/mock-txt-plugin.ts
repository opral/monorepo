import type { LixPlugin } from "../plugin/lix-plugin.js";
import { detectChanges } from "./detect-changes.js";

/**
 * This txt plugin serves as a *simple* testing plugin.
 *
 * - takes care of change detection in tests
 * - simple to maintain because it's text-based
 * - can be used for testing the plugin api itself
 * - no dependencies
 */
export const mockTxtPlugin: LixPlugin = {
	key: "mock-txt-plugin",
	detectChangesGlob: "*.txt",
	detectChanges,
};
