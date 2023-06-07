/**
 * Throws an error if the settings are invalid.
 *
 * Not using zod becaue it's not worth the bundle size (2kb vs 14kb).
 */
export function throwIfInvalidSettings(settings: PluginSettings) {
  if (settings.pathPattern === undefined) {
    throw new Error(
      "The pathPattern setting must be defined and include the {language} placeholder. An example would be './resources/{language}.json'."
    );
  } else if (settings.pathPattern.includes("{language}") === false) {
    throw new Error(
      "The pathPattern setting must be defined and include the {language} placeholder. An example would be './resources/{language}.json'."
    );
  } else if (settings.pathPattern.endsWith(".json") === false) {
    throw new Error(
      "The pathPattern setting must end with '.json'. An example would be './resources/{language}.json'."
    );
  }
}

export type PluginSettings = {
  /**
   * Defines the path pattern for the resources.
   *
   * Must include the `{language}` placeholder.
   *
   * @example
   *  "./resources/{language}.json"
   */
  pathPattern: string;
  variableReferencePattern?: [string, string];
  ignore?: string[];
};
