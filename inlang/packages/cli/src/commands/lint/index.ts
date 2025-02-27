import { Command } from "commander";
import { log } from "../../utilities/log.js";

export const validate = new Command()
  .command("lint")
  .description("Validate the inlang project settings file.")
  .action(validateCommandAction);

export async function validateCommandAction(args: { project: string }) {
  log.info(
    "Upvote https://github.com/opral/lix-sdk/issues/239 to re-introduce linting."
  );
  log.info(
    "Inlang lint rules have been removed for the CLI v3 after the major lix and inlang SDK update to be replaced by a new validation system that generalizes beyond inlang and to reduce the scope of the update."
  );
}
