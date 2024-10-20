import { ProjectSettings } from "./versionedInterfaces.js";
import type { Result } from "@inlang/result";
import { TypeCompiler } from "@sinclair/typebox/compiler";

export class ParseConfigError extends Error {
  readonly #id = "ParseConfigException";

  constructor(message: string, cause?: string) {
    super(message);
    this.name = this.#id;
    this.cause = cause;
  }
}

// @ts-ignore - fix after refactor
const ConfigCompiler = TypeCompiler.Compile(ProjectSettings);

export const parseSettings = (
  config: ProjectSettings,
): Result<ProjectSettings, ParseConfigError> => {
  if (ConfigCompiler.Check(config)) {
    return {
      data: config,
      error: undefined as never,
    };
  } else {
    return {
      error: new ParseConfigError(
        "The inlang config is not valid.",
        [...ConfigCompiler.Errors(config)].toString(),
      ),
      data: undefined as never,
    };
  }
};
