import type { NodeishFilesystem } from "@lix-js/fs";
import type {
  PluginReturnedInvalidCustomApiError,
  PluginLoadMessagesFunctionAlreadyDefinedError,
  PluginSaveMessagesFunctionAlreadyDefinedError,
  PluginHasInvalidIdError,
  PluginHasInvalidSchemaError,
  PluginsDoNotProvideLoadOrSaveMessagesError,
} from "./errors.js";
import type { Message } from "@inlang/message";
import type { CustomApiInlangIdeExtension, Plugin } from "@inlang/plugin";
import type { ProjectSettings } from "@inlang/project-settings";

/**
 * The filesystem is a subset of project lisa's nodeish filesystem.
 *
 * - only uses minimally required functions to decrease the API footprint on the ecosystem.
 */
export type NodeishFilesystemSubset = Pick<
  NodeishFilesystem,
  "readFile" | "readdir" | "mkdir" | "writeFile" | "watch"
>;

/**
 * Function that resolves (imports and initializes) the plugins.
 */
export type ResolvePluginsFunction = (args: {
  plugins: Array<Plugin>;
  settings: ProjectSettings;
  nodeishFs: NodeishFilesystemSubset;
}) => Promise<{
  data: ResolvedPluginApi;
  errors: Array<
    | PluginReturnedInvalidCustomApiError
    | PluginLoadMessagesFunctionAlreadyDefinedError
    | PluginSaveMessagesFunctionAlreadyDefinedError
    | PluginHasInvalidIdError
    | PluginHasInvalidSchemaError
    | PluginsDoNotProvideLoadOrSaveMessagesError
  >;
}>;

/**
 * The API after resolving the plugins.
 */
export type ResolvedPluginApi = {
  loadMessages: (args: {
    settings: ProjectSettings;
    nodeishFs: NodeishFilesystemSubset;
  }) => Promise<Message[]> | Message[];
  saveMessages: (args: {
    settings: ProjectSettings;
    messages: Message[];
    nodeishFs: NodeishFilesystemSubset;
  }) => Promise<void> | void;
  /**
   * App specific APIs.
   *
   * @example
   *  // define
   *  customApi: ({ settings }) => ({
   * 	 "app.inlang.ide-extension": {
   * 	   messageReferenceMatcher: () => {
   * 		 // use settings
   * 		 settings.pathPattern
   * 		return
   * 	   }
   * 	 }
   *  })
   *  // use
   *  customApi['app.inlang.ide-extension'].messageReferenceMatcher()
   */
  customApi: Record<
    `app.${string}.${string}` | `library.${string}.${string}`,
    unknown
  > & {
    "app.inlang.ideExtension"?: CustomApiInlangIdeExtension;
  };
};
