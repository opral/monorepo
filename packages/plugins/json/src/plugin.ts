/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  Message,
  Variant,
  LanguageTag,
  Plugin,
  NodeishFilesystemSubset,
} from "@inlang/sdk";
import { displayName, description } from "../marketplace-manifest.json";
import { PluginSettings } from "./settings.js";
import { replaceAll } from "./utilities.js";
import { flatten, unflatten } from "flat";
import { detectJsonFormatting } from "../../../detect-json-formatting/dist/index.js";

// global variables to store the formatting of the file
let serializeWithFormatting: ReturnType<typeof detectJsonFormatting>;
let hasNestedKeys = false;

const id = "plugin.inlang.json";

export const plugin: Plugin<{
  [id]: PluginSettings;
}> = {
  id,
  displayName,
  description,
  settingsSchema: PluginSettings,
  loadMessages: async ({ settings, nodeishFs }) => {
    settings[id].variableReferencePattern = settings[id]
      .variableReferencePattern || ["{", "}"];
    return loadMessages({
      nodeishFs,
      pluginSettings: settings[id],
      languageTags: settings.languageTags,
      sourceLanguageTag: settings.sourceLanguageTag,
    });
  },
  saveMessages: async ({ messages, settings, nodeishFs }) => {
    settings[id].variableReferencePattern = settings[id]
      .variableReferencePattern || ["{", "}"];
    return saveMessages({
      nodeishFs,
      pluginSettings: settings[id],
      messages,
    });
  },
};

/**
 * Load messages
 *
 * @example const messages = await loadMessages({ fs, settings, languageTags })
 */
async function loadMessages(args: {
  nodeishFs: NodeishFilesystemSubset;
  pluginSettings: PluginSettings;
  languageTags: Readonly<LanguageTag[]>;
  sourceLanguageTag: string;
}): Promise<Message[]> {
  const messages: Message[] = [];
  for (const languageTag of resolveOrderOfLanguageTags(
    args.languageTags,
    args.sourceLanguageTag,
  )) {
    if (typeof args.pluginSettings.pathPattern !== "string") {
      for (const [prefix, path] of Object.entries(
        args.pluginSettings.pathPattern,
      )) {
        const messagesFromFile = await getFileToParse(
          path,
          languageTag,
          args.sourceLanguageTag,
          args.nodeishFs,
        );
        for (const [key, value] of Object.entries(messagesFromFile)) {
          if (Object.keys(value).length !== 0) {
            const prefixedKey = prefix + ":" + replaceAll(key, "u002E", ".");
            addVariantToMessages(
              messages,
              prefixedKey,
              languageTag,
              value,
              args.pluginSettings,
            );
          }
        }
      }
    } else {
      const messagesFromFile = await getFileToParse(
        args.pluginSettings.pathPattern,
        languageTag,
        args.sourceLanguageTag,
        args.nodeishFs,
      );
      for (const [key, value] of Object.entries(messagesFromFile)) {
        if (Object.keys(value).length !== 0) {
          addVariantToMessages(
            messages,
            replaceAll(key, "u002E", "."),
            languageTag,
            value,
            args.pluginSettings,
          );
        }
      }
    }
  }
  return messages;
}

/**
 * Get file to parse
 *
 * To get files and throw if files are not there. Also handles the flattening for nested files
 *
 * @example const storedMessages = await getFileToParse(path, isNested, languageTag, fs)
 */
async function getFileToParse(
  path: string,
  languageTag: string,
  sourceLanguageTag: string,
  nodeishFs: NodeishFilesystemSubset,
): Promise<Record<string, string>> {
  const pathWithLanguage = path.replace("{languageTag}", languageTag);
  // get file, make sure that is not braking when the namespace doesn't exist in every languageTag dir
  try {
    const file = await nodeishFs.readFile(pathWithLanguage, {
      encoding: "utf-8",
    });
    // analyze format of file
    if (sourceLanguageTag === languageTag) {
      serializeWithFormatting = detectJsonFormatting(file);
    }

    const json = JSON.parse(file);

    if (Object.values(json).some((value) => typeof value === "object")) {
      hasNestedKeys = true;
    }

    const flattenedMessages = hasNestedKeys
      ? flatten(json, {
          transformKey: function (key) {
            //replace dots in keys with unicode
            return replaceAll(key, ".", "u002E");
          },
        })
      : json;

    return flattenedMessages;
  } catch (e) {
    // if the namespace doesn't exist for this dir -> continue
    if ((e as any).code === "FileNotFound" || (e as any).code === "ENOENT") {
      // file does not exist yet
      return {};
    }
    throw e;
  }
}

/**
 * Resolve order of languageTags, move sourceLanguage to the first spot
 */
const resolveOrderOfLanguageTags = (
  languageTags: Readonly<LanguageTag[]>,
  sourceLanguageTag: LanguageTag,
): LanguageTag[] => {
  const filteredTags = languageTags.filter((t) => t !== sourceLanguageTag); // Remove sourceLanguageTag
  filteredTags.unshift(sourceLanguageTag); // Add sourceLanguageTag to the beginning of the filtered array
  return filteredTags;
};

/**
 * Add new item (message, variant) to the ast
 *
 * @example addVariantToMessages(messages, key, languageTag, value)
 */
const addVariantToMessages = (
  messages: Message[],
  key: string,
  languageTag: LanguageTag,
  value: string,
  settings: PluginSettings,
) => {
  const messageIndex = messages.findIndex((m) => m.id === key);
  if (messageIndex !== -1) {
    const variant: Variant = {
      languageTag,
      match: [],
      pattern: parsePattern(value, settings.variableReferencePattern!),
    };

    //push new variant
    messages[messageIndex]?.variants.push(variant);
  } else {
    // message does not exist
    const message: Message = {
      id: key,
      alias: {},
      selectors: [],
      variants: [],
    };
    message.variants = [
      {
        languageTag,
        match: [],
        pattern: parsePattern(value, settings.variableReferencePattern!),
      },
    ];
    messages.push(message);
  }
};

/**
 * Parses a pattern.
 *
 * @example parsePattern("Hello {name}!", ["{", "}"])
 */
function parsePattern(
  text: string,
  variableReferencePattern: string[],
): Variant["pattern"] {
  // dependent on the variableReferencePattern, different regex
  // expressions are used for matching
  const expression = variableReferencePattern[1]
    ? new RegExp(
        `(\\${variableReferencePattern[0]}[^\\${variableReferencePattern[1]}]+\\${variableReferencePattern[1]})`,
        "g",
      )
    : new RegExp(`(${variableReferencePattern}\\w+)`, "g");
  const pattern: Variant["pattern"] = text
    .split(expression)
    .filter((element) => element !== "")
    .map((element) => {
      if (expression.test(element) && variableReferencePattern[0]) {
        return {
          type: "VariableReference",
          name: variableReferencePattern[1]
            ? element.slice(
                variableReferencePattern[0].length,
                // negative index, removing the trailing pattern
                -variableReferencePattern[1].length,
              )
            : element.slice(variableReferencePattern[0].length),
        };
      } else {
        return {
          type: "Text",
          value: element,
        };
      }
    });

  return pattern;
}

/**
 * Save messages
 *
 * @example await saveMessages({ fs, settings, messages })
 */
async function saveMessages(args: {
  nodeishFs: NodeishFilesystemSubset;
  pluginSettings: PluginSettings;
  messages: Message[];
}) {
  if (typeof args.pluginSettings.pathPattern === "object") {
    // with namespaces
    const storage: Record<
      LanguageTag,
      Record<string, Record<Message["id"], Variant["pattern"]>>
    > = {};
    for (const message of args.messages) {
      for (const variant of message.variants) {
        const prefix: string = message.id.includes(":")
          ? (message.id.split(":")[0] as string)
          : (Object.keys(args.pluginSettings.pathPattern)[0] as string);
        const resolvedId = message.id.replace(prefix + ":", "");

        storage[variant.languageTag] ??= {};
        storage[variant.languageTag]![prefix] ??= {};
        storage[variant.languageTag]![prefix]![resolvedId] = variant.pattern;
      }
    }
    for (const [languageTag, _value] of Object.entries(storage)) {
      for (const path of Object.values(args.pluginSettings.pathPattern)) {
        // check if directory exists
        const directoryPath = path
          .replace("{languageTag}", languageTag)
          .split("/")
          .slice(0, -1)
          .join("/");
        try {
          await args.nodeishFs.readdir(directoryPath);
        } catch {
          await args.nodeishFs.mkdir(directoryPath);
        }
      }
      for (const [prefix, value] of Object.entries(_value)) {
        const pathWithLanguage = (
          args.pluginSettings.pathPattern[prefix] as string
        ).replace("{languageTag}", languageTag);
        await args.nodeishFs.writeFile(
          pathWithLanguage,
          serializeFile(value, args.pluginSettings.variableReferencePattern),
        );
      }
    }
  } else {
    // without namespaces
    const storage:
      | Record<LanguageTag, Record<Message["id"], Variant["pattern"]>>
      | undefined = {};
    for (const message of args.messages) {
      for (const variant of message.variants) {
        storage[variant.languageTag] ??= {};
        storage[variant.languageTag]![message.id] = variant.pattern;
      }
    }
    for (const [languageTag, value] of Object.entries(storage)) {
      const pathWithLanguage = args.pluginSettings.pathPattern.replace(
        "{languageTag}",
        languageTag,
      );
      try {
        await args.nodeishFs.readdir(
          pathWithLanguage.split("/").slice(0, -1).join("/"),
        );
      } catch {
        await args.nodeishFs.mkdir(
          pathWithLanguage.split("/").slice(0, -1).join("/"),
          {
            recursive: true,
          },
        );
      }

      await args.nodeishFs.writeFile(
        pathWithLanguage,
        serializeFile(value, args.pluginSettings.variableReferencePattern),
      );
    }
  }
}

/**
 * Serializes file
 *
 * For all messages that belong in one file.
 *
 * @example const serializedFile = serializeFile(messages, space, endsWithNewLine, nested, variableReferencePattern)
 */
function serializeFile(
  messages: Record<Message["id"], Variant["pattern"]>,
  variableReferencePattern: PluginSettings["variableReferencePattern"],
): string {
  let result: Record<string, string> = {};
  for (const [messageId, pattern] of Object.entries(messages)) {
    //check if there are two dots after each other -> that would brake unflatten -> replace with unicode
    let id = replaceAll(messageId, "..", "u002E.");
    //check if the last char is a dot -> that would brake unflatten -> replace with unicode
    if (id.slice(-1) === ".") {
      id = id.replace(/.$/, "u002E");
    }
    result[id] = serializePattern(pattern, variableReferencePattern!);
  }
  // for nested structures -> unflatten the keys
  if (hasNestedKeys) {
    result = unflatten(result, {
      //prevent numbers from creating arrays automatically
      object: true,
    });
  }
  return replaceAll(serializeWithFormatting(result), "u002E", ".");
}

/**
 * Serializes a pattern.
 *
 * @example const serializedPattern = serializePattern(pattern, variableReferencePattern)
 */
function serializePattern(
  pattern: Variant["pattern"],
  variableReferencePattern: string[],
) {
  const result: string[] = [];
  for (const element of pattern) {
    switch (element.type) {
      case "Text":
        result.push(element.value);
        break;
      case "VariableReference":
        result.push(
          variableReferencePattern[1]
            ? `${variableReferencePattern[0]}${element.name}${variableReferencePattern[1]}`
            : `${variableReferencePattern[0]}${element.name}`,
        );
        break;
      default:
        throw new Error(
          `Unknown message pattern element of type: ${(element as any)?.type}`,
        );
    }
  }
  return result.join("");
}
