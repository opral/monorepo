import { createUnplugin } from "unplugin";
import {
  type ProjectSettings,
  type InlangProject,
  loadProjectFromDirectoryInMemory,
  selectBundleNested,
  type BundleNested,
} from "@inlang/sdk2";
import path from "node:path";
import fs from "node:fs/promises";
// @ts-ignore
import icu1Importer from "@inlang/plugin-icu1";
// @ts-ignore
import {
  compile,
  writeOutput,
  Logger,
  classifyProjectErrors,
} from "@inlang/paraglide-js/internal";

const PLUGIN_NAME = "unplugin-paraglide";
const VITE_BUILD_PLUGIN_NAME =
  "unplugin-paraglide-vite-virtual-message-modules";

const isWindows =
  typeof process !== "undefined" && process.platform === "win32";

export type UserConfig = {
  project: string;
  outdir: string;
  silent?: boolean;
};

export const paraglide = createUnplugin((config: UserConfig) => {
  const options = {
    silent: false,
    ...config,
  };

  const outputDirectory = path.resolve(process.cwd(), options.outdir);
  let normalizedOutdir = outputDirectory.replaceAll("\\", "/");
  if (!normalizedOutdir.endsWith("/"))
    normalizedOutdir = normalizedOutdir + "/";
  const logger = new Logger({ silent: options.silent, prefix: true });

  //Keep track of how many times we've compiled
  let numCompiles = 0;

  let virtualModuleOutput: Record<string, string> = {};

  async function triggerCompile(
    bundles: readonly BundleNested[],
    settings: ProjectSettings,
  ) {
    logMessageChange();

    const [regularOutput, messageModulesOutput] = await Promise.all([
      compile({ bundles, settings, outputStructure: "regular" }),
      compile({ bundles, settings, outputStructure: "message-modules" }),
    ]);

    virtualModuleOutput = messageModulesOutput as any; // TODO fix type
    const fsOutput = regularOutput;
    await writeOutput(outputDirectory, fsOutput, fs);
    numCompiles++;
  }

  function logMessageChange() {
    if (!logger) return;
    if (options.silent) return;

    if (numCompiles === 0) {
      logger.info(`Compiling Messages into ${options.outdir}`);
    }

    if (numCompiles >= 1) {
      logger.info(`Messages changed - Recompiling into ${options.outdir}`);
    }
  }

  let project: InlangProject | undefined = undefined;
  async function getProject(): Promise<InlangProject> {
    if (project) return project;

    const projectPath = path.resolve(process.cwd(), options.project);
    project = await loadProjectFromDirectoryInMemory({
      path: projectPath,
      fs: fs,
      providePlugins: [icu1Importer],
    });

    return project;
  }

  let acs: AbortController[] = [];
  async function loadAndWatchProject() {
    const project = await getProject();

    const bundles = await selectBundleNested(project.db).execute();

    const settings = await project.settings.get();
    await triggerCompile(bundles, settings);

    project.errors.subscribe((errors) => {
      if (errors.length === 0) return;

      const { fatalErrors, nonFatalErrors } = classifyProjectErrors(errors);
      for (const error of nonFatalErrors) {
        logger.warn(error.message);
      }

      for (const error of fatalErrors) {
        if (error instanceof Error) {
          logger.error(error.message); // hide the stack trace
        } else {
          logger.error(error);
        }
      }
    });

    // watch files
    const resourceFiles = [];
    for (const plugin of await project.plugins.get()) {
      if (!plugin.toBeImportedFiles) continue;
      const pluginFiles = await plugin.toBeImportedFiles({
        settings,
        nodeFs: fs,
      });
      resourceFiles.push(...pluginFiles);
    }

    // Create a watcher for each file
    for (const file of resourceFiles) {
      const ac = new AbortController();
      acs.push(ac);
      const watcher = fs.watch(file.path, { signal: ac.signal });
      onGeneration(watcher, (ev) => {
        if (ev.eventType !== "change") return;
        for (const ac of acs) ac.abort();
        acs = [];
        loadAndWatchProject();
      });
    }
  }

  return [
    {
      name: PLUGIN_NAME,

      enforce: "pre",
      async buildStart() {
        loadAndWatchProject();
      },

      webpack(compiler) {
        //we need the compiler to run before the build so that the message-modules will be present
        //In the other bundlers `buildStart` already runs before the build. In webpack it's a race condition
        compiler.hooks.beforeRun.tapPromise(PLUGIN_NAME, async () => {
          const project = await getProject();
          const bundles = await selectBundleNested(project.db).execute();
          const settings = await project.settings.get();
          await triggerCompile(bundles, settings);
          console.info(`Compiled Messages into ${options.outdir}`);
        });
      },
    },
    {
      name: VITE_BUILD_PLUGIN_NAME,
      vite: {
        apply: "build",
        resolveId(id, importer) {
          // resolve relative imports inside the output directory
          // the importer is alwazs normalized
          if (importer?.startsWith(normalizedOutdir)) {
            const dirname = path.dirname(importer).replaceAll("\\", "/");
            if (id.startsWith(dirname)) return id;

            if (isWindows) {
              const resolvedPath = path
                .resolve(
                  dirname.replaceAll("/", "\\"),
                  id.replaceAll("/", "\\"),
                )
                .replaceAll("\\", "/");
              return resolvedPath;
            }

            const resolvedPath = path.resolve(dirname, id);
            return resolvedPath;
          }
          return undefined;
        },

        load(id) {
          id = id.replaceAll("\\", "/");
          //if it starts with the outdir use the paraglideOutput virtual modules instead
          if (id.startsWith(normalizedOutdir)) {
            const internal = id.slice(normalizedOutdir.length);
            const resolved = virtualModuleOutput[internal];
            return resolved;
          }

          return undefined;
        },
      },
    },
  ];
});

async function onGeneration<T>(
  generator: AsyncIterable<T>,
  cb: (value: T) => void,
) {
  for await (const value of generator) {
    cb(value);
  }
}
