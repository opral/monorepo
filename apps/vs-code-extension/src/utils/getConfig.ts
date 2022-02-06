import { Result } from '@inlang/common';
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
}): Promise<Result<InlangConfig01, Error>> {
  const configFileUris = await vscode.workspace.findFiles('**/inlang.config.json');
  if (configFileUris.length === 0) {
    return Result.err(Error('No `inlang.config.json` file has been found in the workspace.'));
  }
  const closestConfigPath = determineClosestPath({
    options: configFileUris.map((uri) => uri.path),
    to: args.activeTextEditor.document.uri.path,
  });
  const config = JSON.parse(fs.readFileSync(closestConfigPath, 'utf8'));
  const isValidConfig = validate({ config });
  if (isValidConfig.isErr) {
    return Result.err(
      Error(
        `The inlang.config.json is not valid: ${isValidConfig.error.message}\n\n${closestConfigPath}`
      )
    );
  }
  return Result.ok(config);
}
