/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  InlangProject,
  InstalledMessageLintRule,
  InstalledPlugin,
  Subscribable,
  MessageQueryApi,
  MessageLintReportsQueryApi,
} from "./api.js";
import {
  type ImportFunction,
  resolveModules,
} from "./resolve-modules/index.js";
import { TypeCompiler, ValueErrorType } from "@sinclair/typebox/compiler";
import {
  ProjectSettingsFileJSONSyntaxError,
  ProjectSettingsFileNotFoundError,
  ProjectSettingsInvalidError,
} from "./errors.js";
import {
  createRoot,
  createSignal,
  createEffect,
  batch,
} from "./reactivity/solid.js";
import { createMessagesQuery } from "./createMessagesQuery.js";
import { createMessageLintReportsQuery } from "./createMessageLintReportsQuery.js";
import {
  ProjectSettings,
  type NodeishFilesystemSubset,
} from "./versionedInterfaces.js";
import { tryCatch, type Result } from "@inlang/result";
import { migrateIfOutdated } from "@inlang/project-settings/migration";
import { createNodeishFsWithAbsolutePaths } from "./createNodeishFsWithAbsolutePaths.js";
import { createNodeishFsWithWatcher } from "./createNodeishFsWithWatcher.js";
import { normalizePath } from "@lix-js/fs";
import { assertValidProjectPath } from "./validateProjectPath.js";

// Migrations
import { maybeMigrateToDirectory } from "./migrations/migrateToDirectory.js";
import { maybeCreateFirstProjectId } from "./migrations/maybeCreateFirstProjectId.js";
import { maybeAddModuleCache } from "./migrations/maybeAddModuleCache.js";

import type { Repository } from "@lix-js/client";

import { capture } from "./telemetry/capture.js";
import { identifyProject } from "./telemetry/groupIdentify.js";

import {
  stubMessagesQuery,
  stubMessageLintReportsQuery,
} from "./v2/stubQueryApi.js";
import type { StoreApi } from "./persistence/storeApi.js";
import { openStore } from "./persistence/store.js";

import _debug from "debug";
const debug = _debug("sdk:loadProject");

const settingsCompiler = TypeCompiler.Compile(ProjectSettings);

/**
 * @param projectPath - Absolute path to the inlang settings file.
 * @param repo - An instance of a lix repo as returned by `openRepository`.
 * @param _import - Use `_import` to pass a custom import function for testing,
 *   and supporting legacy resolvedModules such as CJS.
 * @param appId - The app id to use for telemetry e.g "app.inlang.badge"
 *
 */
export async function loadProject(args: {
  projectPath: string;
  repo: Repository;
  appId?: string;
  _import?: ImportFunction;
}): Promise<InlangProject> {
  const projectPath = normalizePath(args.projectPath);

  // -- validation --------------------------------------------------------
  // the only place where throwing is acceptable because the project
  // won't even be loaded. do not throw anywhere else. otherwise, apps
  // can't handle errors gracefully.

  assertValidProjectPath(projectPath);
  debug(projectPath);

  const nodeishFs = createNodeishFsWithAbsolutePaths({
    projectPath,
    nodeishFs: args.repo.nodeishFs,
  });

  // -- migratations ------------------------------------------------

  await maybeMigrateToDirectory({ nodeishFs, projectPath });
  await maybeCreateFirstProjectId({ projectPath, repo: args.repo });
  await maybeAddModuleCache({ projectPath, repo: args.repo });

  // -- load project ------------------------------------------------------

  return await createRoot(async () => {
    // TODO remove tryCatch after https://github.com/opral/monorepo/issues/2013
    // - a repo will always be present
    // - if a repo is present, the project id will always be present
    const { data: projectId } = await tryCatch(() =>
      nodeishFs.readFile(args.projectPath + "/project_id", {
        encoding: "utf-8",
      }),
    );

    const [initialized, markInitAsComplete, markInitAsFailed] =
      createAwaitable();
    const [loadedSettings, markSettingsAsLoaded, markSettingsAsFailed] =
      createAwaitable();

    const [resolvedModules, setResolvedModules] =
      createSignal<Awaited<ReturnType<typeof resolveModules>>>();
    // -- settings ------------------------------------------------------------

    const [settings, _setSettings] = createSignal<ProjectSettings>();
    let v2Persistence = false;
    let locales: string[] = [];

    // TODO:
    // if (projectId) {
    // 	telemetryBrowser.group("project", projectId, {
    // 		name: projectId,
    // 	})
    // }

    const setSettings = (
      newSettings: ProjectSettings,
    ): Result<ProjectSettings, ProjectSettingsInvalidError> => {
      try {
        const validatedSettings = parseSettings(newSettings);
        v2Persistence = !!validatedSettings.experimental?.persistence;
        locales = validatedSettings.languageTags;

        batch(() => {
          // reset the resolved modules first - since they are no longer valid at that point
          setResolvedModules(undefined);
          _setSettings(validatedSettings);
        });

        return { data: validatedSettings };
      } catch (error: unknown) {
        if (error instanceof ProjectSettingsInvalidError) {
          return { error };
        }

        throw new Error(
          "Unhandled error in setSettings. This is an internal bug. Please file an issue.",
          { cause: error },
        );
      }
    };

    const nodeishFsWithWatchersForSettings = createNodeishFsWithWatcher({
      nodeishFs: nodeishFs,
      onChange: async () => {
        const readSettingsResult = await tryCatch(
          async () =>
            await loadSettings({
              settingsFilePath: projectPath + "/settings.json",
              nodeishFs: nodeishFs,
            }),
        );

        if (readSettingsResult.error) return;
        const newSettings = readSettingsResult.data;

        if (JSON.stringify(newSettings) !== JSON.stringify(settings())) {
          setSettings(newSettings);
        }
      },
    });

    const settingsResult = await tryCatch(
      async () =>
        await loadSettings({
          settingsFilePath: projectPath + "/settings.json",
          nodeishFs: nodeishFsWithWatchersForSettings,
        }),
    );

    if (settingsResult.error) {
      markInitAsFailed(settingsResult.error);
      markSettingsAsFailed(settingsResult.error);
    } else {
      setSettings(settingsResult.data);
      markSettingsAsLoaded();
    }

    // -- resolvedModules -----------------------------------------------------------

    createEffect(() => {
      const _settings = settings();
      if (!_settings) return;

      resolveModules({
        settings: _settings,
        nodeishFs,
        _import: args._import,
        projectPath,
      })
        .then((resolvedModules) => {
          setResolvedModules(resolvedModules);
        })
        .catch((err) => markInitAsFailed(err));
    });

    // -- installed items ----------------------------------------------------

    let settingsValue: ProjectSettings;
    // workaround to not run effects twice (e.g. settings change + modules change) (I'm sure there exists a solid way of doing this, but I haven't found it yet)
    createEffect(() => (settingsValue = settings()!));

    const installedMessageLintRules = () => {
      if (!resolvedModules()) return [];
      return resolvedModules()!.messageLintRules.map(
        (rule) =>
          ({
            id: rule.id,
            displayName: rule.displayName,
            description: rule.description,
            module:
              resolvedModules()?.meta.find((m) => m.id.includes(rule.id))
                ?.module ??
              "Unknown module. You stumbled on a bug in inlang's source code. Please open an issue.",
            // default to warning, see https://github.com/opral/monorepo/issues/1254
            level:
              settingsValue["messageLintRuleLevels"]?.[rule.id] ?? "warning",
            settingsSchema: rule.settingsSchema,
          }) satisfies InstalledMessageLintRule,
      ) satisfies Array<InstalledMessageLintRule>;
    };

    const installedPlugins = () => {
      if (!resolvedModules()) return [];
      return resolvedModules()!.plugins.map((plugin) => ({
        id: plugin.id,
        displayName: plugin.displayName,
        description: plugin.description,
        module:
          resolvedModules()?.meta.find((m) => m.id.includes(plugin.id))
            ?.module ??
          "Unknown module. You stumbled on a bug in inlang's source code. Please open an issue.",
        settingsSchema: plugin.settingsSchema,
      })) satisfies Array<InstalledPlugin>;
    };

    // -- messages ----------------------------------------------------------

    const [loadMessagesViaPluginError, setLoadMessagesViaPluginError] =
      createSignal<Error | undefined>();

    const [saveMessagesViaPluginError, setSaveMessagesViaPluginError] =
      createSignal<Error | undefined>();

    let messagesQuery: MessageQueryApi;
    let lintReportsQuery: MessageLintReportsQueryApi;
    let store: StoreApi | undefined;

    // wait for seetings to load v2Persistence flag
    // .catch avoids throwing here if the awaitable is rejected
    // error is recorded via markInitAsFailed so no need to capture it again
    await loadedSettings.catch(() => {});

    if (v2Persistence) {
      messagesQuery = stubMessagesQuery;
      lintReportsQuery = stubMessageLintReportsQuery;
      try {
        store = await openStore({ projectPath, nodeishFs, locales });
        markInitAsComplete();
      } catch (e) {
        markInitAsFailed(e);
      }
    } else {
      messagesQuery = createMessagesQuery({
        projectPath,
        nodeishFs,
        settings,
        resolvedModules,
        onInitialMessageLoadResult: (e) => {
          if (e) {
            markInitAsFailed(e);
          } else {
            markInitAsComplete();
          }
        },
        onLoadMessageResult: (e) => {
          setLoadMessagesViaPluginError(e);
        },
        onSaveMessageResult: (e) => {
          setSaveMessagesViaPluginError(e);
        },
      });

      lintReportsQuery = createMessageLintReportsQuery(
        messagesQuery,
        settings as () => ProjectSettings,
        installedMessageLintRules,
        resolvedModules,
      );

      store = undefined;
    }

    // -- app ---------------------------------------------------------------

    const initializeError: Error | undefined = await initialized.catch(
      (error) => error,
    );

    /**
     * Utility to escape reactive tracking and avoid multiple calls to
     * the capture event.
     *
     * Should be addressed with https://github.com/opral/monorepo/issues/1772
     */
    let projectLoadedCapturedAlready = false;

    if (projectId && projectLoadedCapturedAlready === false) {
      projectLoadedCapturedAlready = true;
      // TODO ensure that capture is "awaited" without blocking the the app from starting
      await identifyProject({
        projectId,
        properties: {
          // using the id for now as a name but can be changed in the future
          // we need at least one property to make a project visible in the dashboard
          name: projectId,
        },
      });
      await capture("SDK loaded project", {
        projectId,
        properties: {
          appId: args.appId,
          settings: settings(),
          installedPluginIds: installedPlugins().map((p) => p.id),
          installedMessageLintRuleIds: installedMessageLintRules().map(
            (r) => r.id,
          ),
          // TODO: fix for v2Persistence
          // https://github.com/opral/inlang-message-sdk/issues/78
          numberOfMessages: messagesQuery.includedMessageIds().length,
        },
      });
    }

    return {
      id: projectId,
      installed: {
        plugins: createSubscribable(() => installedPlugins()),
        messageLintRules: createSubscribable(() => installedMessageLintRules()),
      },
      errors: createSubscribable(() => [
        ...(initializeError ? [initializeError] : []),
        ...(resolvedModules() ? resolvedModules()!.errors : []),
        ...(loadMessagesViaPluginError()
          ? [loadMessagesViaPluginError()!]
          : []),
        ...(saveMessagesViaPluginError()
          ? [saveMessagesViaPluginError()!]
          : []),
        // have a query error exposed
        //...(lintErrors() ?? []),
      ]),
      settings: createSubscribable(() => settings() as ProjectSettings),
      setSettings: (
        newSettings: ProjectSettings,
      ): Result<void, ProjectSettingsInvalidError> => {
        const result = setSettings(newSettings);
        if (!result.error)
          writeSettingsToDisk({
            nodeishFs,
            settings: result.data,
            projectPath,
          });
        return result.error ? result : { data: undefined };
      },
      customApi: createSubscribable(
        () => resolvedModules()?.resolvedPluginApi.customApi || {},
      ),
      query: {
        messages: messagesQuery,
        messageLintReports: lintReportsQuery,
      },
      store,
    } satisfies InlangProject;
  });
}

// ------------------------------------------------------------------------------------------------

const loadSettings = async (args: {
  settingsFilePath: string;
  nodeishFs: NodeishFilesystemSubset;
}) => {
  const { data: settingsFile, error: settingsFileError } = await tryCatch(
    async () =>
      await args.nodeishFs.readFile(args.settingsFilePath, {
        encoding: "utf-8",
      }),
  );
  if (settingsFileError)
    throw new ProjectSettingsFileNotFoundError({
      cause: settingsFileError,
      path: args.settingsFilePath,
    });

  const json = tryCatch(() => JSON.parse(settingsFile!));

  if (json.error) {
    throw new ProjectSettingsFileJSONSyntaxError({
      cause: json.error,
      path: args.settingsFilePath,
    });
  }
  return parseSettings(json.data);
};

/**
 * @throws If the settings are not valid
 */
const parseSettings = (settings: unknown) => {
  const withMigration = migrateIfOutdated(settings as any);
  if (settingsCompiler.Check(withMigration) === false) {
    const typeErrors = [...settingsCompiler.Errors(settings)];
    if (typeErrors.length > 0) {
      throw new ProjectSettingsInvalidError({
        errors: typeErrors,
      });
    }
  }

  const { sourceLanguageTag, languageTags } = settings as ProjectSettings;
  if (!languageTags.includes(sourceLanguageTag)) {
    throw new ProjectSettingsInvalidError({
      errors: [
        {
          message: `The sourceLanguageTag "${sourceLanguageTag}" is not included in the languageTags "${languageTags.join(
            '", "',
          )}". Please add it to the languageTags.`,
          type: ValueErrorType.String,
          schema: ProjectSettings,
          value: sourceLanguageTag,
          path: "sourceLanguageTag",
        },
      ],
    });
  }

  return withMigration;
};

const writeSettingsToDisk = async (args: {
  projectPath: string;
  nodeishFs: NodeishFilesystemSubset;
  settings: ProjectSettings;
}) => {
  const serializeResult = tryCatch(() =>
    // TODO: this will probably not match the original formatting
    JSON.stringify(args.settings, undefined, 2),
  );
  if (serializeResult.error) throw serializeResult.error;
  const serializedSettings = serializeResult.data;

  const writeResult = await tryCatch(
    async () =>
      await args.nodeishFs.writeFile(
        args.projectPath + "/settings.json",
        serializedSettings,
      ),
  );

  if (writeResult.error) throw writeResult.error;
};

// ------------------------------------------------------------------------------------------------

const createAwaitable = () => {
  let resolve: () => void;
  let reject: () => void;

  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return [promise, resolve!, reject!] as [
    awaitable: Promise<void>,
    resolve: () => void,
    reject: (e: unknown) => void,
  ];
};

export function createSubscribable<T>(signal: () => T): Subscribable<T> {
  return Object.assign(signal, {
    subscribe: (callback: (value: T) => void) => {
      createEffect(() => {
        callback(signal());
      });
    },
  });
}
