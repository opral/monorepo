import * as vscode from "vscode";
import { setState } from "./state.js";
import { extractMessageCommand } from "./commands/extractMessage.js";
import { inlinePattern } from "./decorations/inlinePattern.js";
import { determineClosestPath } from "./utils/determineClosestPath.js";
import type { Config as InlangConfig } from "@inlang/core/config";
import { initialize$import } from "@inlang/core/config";
import fs from "node:fs/promises";
import fetch from 'node-fetch';

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    vscode.window.showInformationMessage("Inlang extension activated.");
    // start the extension
    main({ context });
    // in case the active window changes -> restart the extension
    // (could be improved in the future for performance reasons
    // by detecting whether the closest config differs. For now,
    // it's easier to restart the application each time.)
    vscode.window.onDidChangeActiveTextEditor(() => {
      // in case of running subscriptions -> dispose them (no commands will be shown anymore in the IDE)
      for (const subscription of context.subscriptions) {
        subscription.dispose();
      }
      // restart extension
      main({ context });
    });
  } catch (error) {
    vscode.window.showErrorMessage((error as Error).message);
    console.error(error);
  }
}

/**
 * The main entry of the extension.
 *
 * This function registers all commands, actions, loads the config etc.
 */
async function main(args: { context: vscode.ExtensionContext }): Promise<void> {
  // if no active text editor -> no window is open -> hence dont activate the extension
  const activeTextEditor = vscode.window.activeTextEditor;
  if (activeTextEditor === undefined) {
    return;
  }
  // checking whether a config file exists -> if not dont start the extension
  const potentialConfigFileUris = await vscode.workspace.findFiles(
    "**/inlang.config.js"
  );
  if (potentialConfigFileUris.length === 0) {
    return;
  }
  const closestConfigPath = determineClosestPath({
    options: potentialConfigFileUris.map((uri) => uri.path),
    to: activeTextEditor.document.uri.path,
  });

  const $import = initialize$import({ fs, fetch });
  const configModule: InlangConfig = await (await import(closestConfigPath)).defineConfig({ $import });
  setState({
    config: configModule,
    configPath: closestConfigPath
  });

  // register the commands
  args.context.subscriptions.push(
    vscode.commands.registerCommand(
      extractMessageCommand.id,
      extractMessageCommand.callback
    )
  );

  // register decorations
  inlinePattern({ activeTextEditor });
}

// this method is called when your extension is deactivated
// export function deactivate() {}
