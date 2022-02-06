import { Result } from '@inlang/common';
import { InlangConfig01, validate } from '@inlang/config';
import * as vscode from 'vscode';
import fs from 'fs';
import { determineClosestPath } from './utils/determineClosestFile';

/**
 * The state of the vscode extension.
 */
type State = {
  configFileUris: vscode.Uri[];
  config: InlangConfig01;
};

/**
 * Initialize the state.
 *
 * The main purpose is to import the closest inlang.config.json file.
 */
export async function initState(args: {
  activeTextEditor: vscode.TextEditor;
}): Promise<Result<void, Error>> {
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
  state = {
    configFileUris,
    config,
  };
  return Result.ok(undefined);
}

export let state: State;
