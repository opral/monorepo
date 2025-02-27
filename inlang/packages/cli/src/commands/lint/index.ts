import { Command } from "commander";
import { log } from "../../utilities/log.js";

export const lint = new Command()
  .command("lint")
  .description("Validate the inlang project settings file.")
  .option("--project <path>", "Path to the inlang project.")
  .option("--languageTags", "Fix linting errors.")
  .action(lintCommandAction);

export async function lintCommandAction(args: { project: string }) {
  log.warn(
    "Inlang lint rules have been removed for the CLI v3 after the major lix and inlang SDK update to be replaced by a new validation system that generalizes beyond inlang and to reduce the scope of the update."
  );
  log.info(
    "Upvote https://github.com/opral/lix-sdk/issues/239 to re-introduce linting."
  );
}
