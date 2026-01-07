/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Command } from "commander";
import { rpc } from "@inlang/rpc";
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
import {
  machineTranslateBundle,
  type MachineTranslateResult,
} from "./machineTranslateBundle.js";

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
    const useRpcFallback = !googleApiKey;

    if (useRpcFallback) {
      log.info(
        [
          "Using inlang's free machine translate service.",
          "Provide your own INLANG_GOOGLE_TRANSLATE_API_KEY for higher reliability and control.",
        ].join("\n")
      );
    }

    bar?.start(bundles.length, 0);

    const promises: Promise<MachineTranslateResult>[] = [];
    const errors: string[] = [];

    for (const bundle of bundles) {
      const translationPromise = useRpcFallback
        ? rpc.machineTranslateBundle({
            bundle,
            sourceLocale: settings.baseLocale,
            targetLocales: targetLocales,
          })
        : machineTranslateBundle({
            bundle,
            sourceLocale: settings.baseLocale,
            targetLocales: targetLocales,
            googleApiKey,
          });

      const trackedPromise = (
        translationPromise as Promise<MachineTranslateResult>
      ).then((result) => {
        bar?.increment();
        return result;
      });

      promises.push(trackedPromise);
    }

    const updatedBundles = await Promise.all(promises);

    for (const bundle of updatedBundles) {
      if (bundle.error) {
        errors.push(bundle.error);
        continue;
      } else if (bundle.data) {
        await upsertBundleNested(args.project.db, bundle.data);
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
