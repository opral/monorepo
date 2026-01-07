import fs from "node:fs";
import { loadProjectFromDirectory, type InlangProject } from "@inlang/sdk";
import { fileQueueSettled } from "@inlang/sdk/lix";
import { resolve } from "node:path";

/**
 * Used for telemetry.
 */
export let lastUsedProject: InlangProject | undefined;

/**
 * Gets the inlang project and exits if the project contains errors.
 */
export async function getInlangProject(args: {
  projectPath: string;
}): Promise<InlangProject> {
  try {
    const baseDirectory = process.cwd();
    const projectPath = resolve(baseDirectory, args.projectPath);

    const project = await loadProjectFromDirectory({
      path: projectPath,
      fs: fs,
      appId: "app",
    });

    lastUsedProject = project;
    return project;
  } catch (err) {
    console.error(`Error opening inlang project at ${args.projectPath}`, err);
    process.exit(1);
  }
}

export async function settleLastUsedProjectFileQueue(): Promise<void> {
  if (!lastUsedProject) {
    return;
  }
  try {
    await fileQueueSettled({ lix: lastUsedProject.lix });
  } catch {
    // Best-effort: ignore queue settle failures during shutdown.
  }
}
