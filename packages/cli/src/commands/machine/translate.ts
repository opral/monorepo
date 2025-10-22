/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Command } from "commander";
import { getInlangProject } from "../../utilities/getInlangProject.js";
import { log, logError } from "../../utilities/log.js";
import {
  saveProjectToDirectory,
  selectBundleNested,
  upsertBundleNested,
  type InlangProject,
} from "@inlang/sdk";
import { projectOption } from "../../utilities/globalFlags.js";
import progessBar from "cli-progress";
import fs from "node:fs/promises";
import { machineTranslateBundle } from "./machineTranslateBundle.js";

export const translate = new Command()
  .command("translate")
  .requiredOption(projectOption.flags, projectOption.description)
  .option("-q, --quiet", "don't log every tranlation.", false)
  .option("--locale <source>", "Locales for translation.")
  .option(
    "--targetLocales <targets...>",
    "Comma separated list of target locales for translation."
  )
  .option("-n, --nobar", "disable progress bar", false)
  .description("Machine translate bundles.")
  .action(async (args: { force: boolean; project: string }) => {
    try {
      const project = await getInlangProject({ projectPath: args.project });
      await translateCommandAction({ project });
      await saveProjectToDirectory({ fs, path: args.project, project });
      process.exit(0);
    } catch (error) {
      logError(error);
      process.exit(1);
    }
  });

export async function translateCommandAction(args: { project: InlangProject }) {
  const options = translate.opts();

  const bar = options.nobar
    ? undefined
    : new progessBar.SingleBar(
        {
          clearOnComplete: true,
          format: `🤖 Machine translating bundles | {bar} | {percentage}% | {value}/{total} Bundles`,
        },
        progessBar.Presets.shades_grey
      );
  try {
    const settings = await args.project.settings.get();

    const targetLocales: string[] = options.targetLocales
      ? options.targetLocales[0]?.split(",")
      : settings.locales;

    const bundles = await selectBundleNested(args.project.db)
      .selectAll()
      .execute();

    if (bundles.length === 0) {
      log.warn(
        "No message bundles found to translate. Check your project setup with `inlang validate`"
      );
      return;
    }

    const googleApiKey = process.env.INLANG_GOOGLE_TRANSLATE_API_KEY;

    if (!googleApiKey) {
      log.error(
        "Set the INLANG_GOOGLE_TRANSLATE_API_KEY environment variable before running machine translate."
      );
      return;
    }

    bar?.start(bundles.length, 0);

    const promises: Promise<
      Awaited<ReturnType<typeof machineTranslateBundle>>
    >[] = [];
    const errors: string[] = [];

    for (const bundle of bundles) {
      promises.push(
        machineTranslateBundle({
          bundle,
          sourceLocale: settings.baseLocale,
          targetLocales: targetLocales,
          googleApiKey,
        }).then((result) => {
          bar?.increment();
          return result;
        })
      );
    }

    const updatedBundles = await Promise.all(promises);

    for (const bundle of updatedBundles) {
      if (bundle.error) {
        errors.push(bundle.error);
        continue;
      } else if (bundle.data) {
        await upsertBundleNested(args.project, bundle.data);
      }
    }
    bar?.stop();

    log.success("Machine translate complete.");
    if (errors.length > 0) {
      log.warn("Some bundles could not be translated.");
      log.warn(errors.join("\n"));
    }
  } catch (error) {
    logError(error);
  }
}
