import type { Plugin } from "@inlang/plugin";
import type { ValueError } from "@sinclair/typebox/errors";

export class PluginHasInvalidIdError extends Error {
  constructor(options: { id: Plugin["id"] }) {
    super(
      `Plugin "${options.id}" has an invalid id. The id must:\n1) Start with "plugin."\n2) camelCase\n3) Contain a namespace.\nAn example would be "plugin.namespace.myPlugin".`,
    );
    this.name = "PluginHasInvalidIdError";
  }
}

export class PluginHasInvalidSchemaError extends Error {
  constructor(options: { id: Plugin["id"]; errors: ValueError[] }) {
    super(
      `Plugin "${options.id}" has an invalid schema:\n\n${options.errors
        .map(
          (error) =>
            `Path "${error.path}" with value "${error.value}": "${error.message}"`,
        )
        .join(
          "\n",
        )})}\n\nPlease refer to the documentation for the correct schema.`,
    );
    this.name = "PluginHasInvalidSchemaError";
  }
}

export class PluginLoadMessagesFunctionAlreadyDefinedError extends Error {
  constructor(options: { id: Plugin["id"] }) {
    super(
      `Plugin "${options.id}" defines the \`loadMessages()\` function, but it was already defined by another plugin.\n\nInlang only allows one plugin to define the \`loadMessages()\` function.`,
    );
    this.name = "PluginLoadMessagesFunctionAlreadyDefinedError";
  }
}

export class PluginSaveMessagesFunctionAlreadyDefinedError extends Error {
  constructor(options: { id: Plugin["id"] }) {
    super(
      `Plugin "${options.id}" defines the \`saveMessages()\` function, but it was already defined by another plugin.\n\nInlang only allows one plugin to define the \`saveMessages()\` function.`,
    );
    this.name = "PluginSaveMessagesFunctionAlreadyDefinedError";
  }
}

export class PluginReturnedInvalidCustomApiError extends Error {
  constructor(options: { id: Plugin["id"]; cause: ErrorOptions["cause"] }) {
    super(
      `Plugin "${options.id}" returned an invalid custom API:\n\n${options.cause}`,
      options,
    );
    this.name = "PluginReturnedInvalidCustomApiError";
  }
}

export class PluginsDoNotProvideLoadOrSaveMessagesError extends Error {
  constructor() {
    super(
      `No plugin provides a \`loadMessages()\` or \`saveMessages()\` function\n\nIn case no plugin threw an error, you likely forgot to add a plugin that handles the loading and saving of messages. Refer to the marketplace for available plugins https://inlang.com/marketplace.`,
    );
    this.name = "PluginsDoNotProvideLoadOrSaveMessagesError";
  }
}
