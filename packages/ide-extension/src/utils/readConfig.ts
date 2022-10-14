import type * as vscode from "vscode";
import { determineClosestPath } from "./determineClosestPath.js";
import fs from "fs";
import type { Config as InlangConfig } from "@inlang/config";

/**
 * Gets the closest inlang.config.json file relative to the current texteditor window.
 *
 * Especially useful in monorepos.
 */
// export async function readConfig(args: {
// 	activeTextEditor: vscode.TextEditor;
// 	configFileUris: vscode.Uri[];
// }): Promise<{ config: InlangConfig; path: string }> {
// 	try {
// 		const closestConfigPath = determineClosestPath({
// 			options: args.configFileUris.map((uri) => uri.path),
// 			to: args.activeTextEditor.document.uri.path,
// 		});

// 		// return Result.ok({ config: config, path: closestConfigPath });
// 	} catch (error) {
// 		//;
// 		// return Result.err(error as Error);
// 	}
// }
