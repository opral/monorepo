import type { InlangConfig } from "@inlang/config"
import type { NodeishFilesystemSubset } from "@inlang/plugin"

/**
 * Tries to auto-generate an inlang config file.
 *
 * If successful, returns the config object.
 * Else, returns undefined.
 */
export async function tryAutoGenerateInlangConfig(
	nodeishFs: NodeishFilesystemSubset,
	workingDirectory: string,
): Promise<InlangConfig | undefined> {
	return
}
