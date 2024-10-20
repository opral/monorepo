import type { ValueError } from "@sinclair/typebox/errors";
export * from "./plugins/errors.js";
export * from "./message-lint-rules/errors.js";

export class ModuleError extends Error {
  public readonly module: string;

  constructor(message: string, options: { module: string; cause?: Error }) {
    super(message);
    this.name = "ModuleError";
    this.module = options.module;
    this.cause = options.cause;
  }
}

/**
 * Error when a Module does not export any plugins or lint rules.
 */
export class ModuleHasNoExportsError extends ModuleError {
  constructor(options: { module: string; cause?: Error }) {
    super(
      `Module "${options.module}" has no exports. Every module must have an "export default".`,
      options,
    );
    this.name = "ModuleHasNoExportsError";
  }
}

/**
 * Error when a Module cannot be imported.
 */
export class ModuleImportError extends ModuleError {
  constructor(options: { module: string; cause: Error }) {
    super(
      `Couldn't import the plugin "${options.module}":\n\n${options.cause}`,
      options,
    );
    this.name = "ModuleImportError";
  }
}

export class ModuleExportIsInvalidError extends ModuleError {
  constructor(options: { module: string; errors: ValueError[] }) {
    super(
      `The export(s) of "${options.module}" are invalid:\n\n${options.errors
        .map(
          (error) =>
            `"${error.path}" "${JSON.stringify(error.value, undefined, 2)}": "${error.message}"`,
        )
        .join("\n")}`,
      options,
    );
    this.name = "ModuleExportIsInvalidError";
  }
}

export class ModuleSettingsAreInvalidError extends ModuleError {
  constructor(options: { module: string; errors: ValueError[] }) {
    super(
      `The settings are invalid of "${options.module}" are invalid:\n\n${options.errors
        .map(
          (error) =>
            `Path "${error.path}" with value "${JSON.stringify(error.value, undefined, 2)}": "${
              error.message
            }"`,
        )
        .join("\n")}`,
      options,
    );
    this.name = "ModuleSettingsAreInvalidError";
  }
}
