import type { SchemaOptions } from "@sinclair/typebox";
import type { ValueError } from "@sinclair/typebox/errors";

export class LoadProjectInvalidArgument extends Error {
  constructor(message: string, options: { argument: string }) {
    super(
      `The argument "${options.argument}" of loadProject() is invalid: ${message}`,
    );
    this.name = "LoadProjectInvalidArgument";
  }
}

export class ProjectSettingsInvalidError extends Error {
  constructor(options: { errors: ValueError[] }) {
    // TODO: beatufiy ValueErrors
    super(
      `The project settings are invalid:
${options.errors
  .filter((error) => error.path)
  .map(FormatProjectSettingsError)
  .join("\n")}`,
    );
    this.name = "ProjectSettingsInvalidError";
  }
}

function FormatProjectSettingsError(error: ValueError) {
  let msg = `${error.message} at ${error.path}`;
  if (error.path.startsWith("/modules/")) {
    msg += `
value = "${error.value}"
- ${error.schema.allOf.map((o: SchemaOptions) => `${o.description ?? ""}`).join("\n- ")}`;
  }
  return msg;
}

export class ProjectSettingsFileJSONSyntaxError extends Error {
  constructor(options: { cause: ErrorOptions["cause"]; path: string }) {
    super(
      `The settings file at "${options.path}" is not a valid JSON file:\n\n${options.cause}`,
      options,
    );
    this.name = "ProjectSettingsFileJSONSyntaxError";
  }
}

export class ProjectSettingsFileNotFoundError extends Error {
  constructor(options: { cause?: ErrorOptions["cause"]; path: string }) {
    super(
      `The file at "${options.path}" could not be read. Does the file exists?`,
      options,
    );
    this.name = "ProjectSettingsFileNotFoundError";
  }
}

export class PluginSaveMessagesError extends Error {
  constructor(options: { cause: ErrorOptions["cause"] }) {
    super(
      `An error occured in saveMessages() caused by ${options.cause}.`,
      options,
    );
    this.name = "PluginSaveMessagesError";
  }
}

export class PluginLoadMessagesError extends Error {
  constructor(options: { cause: ErrorOptions["cause"] }) {
    super(
      `An error occured in loadMessages() caused by ${options.cause}.`,
      options,
    );
    this.name = "PluginLoadMessagesError";
  }
}

export class LoadMessageError extends Error {
  constructor(options: {
    path: string;
    messageId: string;
    cause: ErrorOptions["cause"];
  }) {
    super(
      `An error occured when loading message ${options.messageId} from path ${options.path} caused by ${options.cause}.`,
      options,
    );
    this.name = "LoadMessageError";
  }
}

export class SaveMessageError extends Error {
  constructor(options: {
    path: string;
    messageId: string;
    cause: ErrorOptions["cause"];
  }) {
    super(
      `An error occured when loading message ${options.messageId} from path ${options.path} caused by ${options.cause}.`,
      options,
    );
    this.name = "SaveMessageError";
  }
}
