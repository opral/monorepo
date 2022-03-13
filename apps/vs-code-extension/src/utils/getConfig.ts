import { Result } from '@inlang/utils';
import { InlangConfig01, validate } from '@inlang/config';
import * as vscode from 'vscode';
import { determineClosestPath } from './determineClosestPath';
import fs from 'fs';

/**
 * Gets the closest inlang.config.json file relative to the current texteditor window.
 *
 * Especially useful in monorepos.
 */
export async function getConfig(args: {
  activeTextEditor: vscode.TextEditor;
  configFileUris: vscode.Uri[];
}): Promise<Result<{ config: InlangConfig01; path: string }, Error>> {
  try {
    const closestConfigPath = determineClosestPath({
      options: args.configFileUris.map((uri) => uri.path),
      to: args.activeTextEditor.document.uri.path,
    });
    const config = JSON.parse(fs.readFileSync(closestConfigPath, 'utf8'));
    const isValidConfig = validate({ config });
    if (isValidConfig.isErr) {
      throw Error(
        `The inlang.config.json is not valid: ${isValidConfig.error.message}\n\n${closestConfigPath}`
      );
    }
    return Result.ok({ config: config, path: closestConfigPath });
  } catch (error) {
    return Result.err(error as Error);
  }
}
