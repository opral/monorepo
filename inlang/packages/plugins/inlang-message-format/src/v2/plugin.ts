// @ts-nocheck

import type { InlangPlugin, Message } from "@inlang/sdk";
import type { StorageSchema } from "../fileSchema.js";
import { PluginSettings } from "../settings.js";
import { serializeMessage } from "./parsing/serializeMessage.js";
import { parseMessage } from "./parsing/parseMessage.js";

export const pluginId = "plugin.inlang.messageFormat";

export const plugin: InlangPlugin<{
	[pluginId]: PluginSettings;
}> = {
	id: pluginId,
	displayName: "Inlang Message Format",
	description:
		"A plugin for the inlang SDK that uses a JSON file per language tag to store translations.",
	key: "inlang-message-format",
	settingsSchema: PluginSettings,
	loadMessages: async ({ settings, nodeishFs }) => {
		await maybeMigrateToV2({ settings, nodeishFs });
		// TODO - Call fs.readDir to automatically add the directory to the watchlist

		const result: Record<string, Message> = {};

		for (const tag of settings.languageTags) {
			try {
				const file = await nodeishFs.readFile(
					settings["plugin.inlang.messageFormat"].pathPattern.replace(
						"{languageTag}",
						tag
					),
					{
						encoding: "utf-8",
					}
				);
				const json = JSON.parse(file);
				for (const key in json) {
					if (key === "$schema") {
						continue;
					}
					// message already exists, add the variants
					else if (result[key]) {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						result[key]!.variants = [
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							...result[key]!.variants,
							...parseMessage({ key, value: json[key], languageTag: tag })
								.variants,
						];
					}
					// message does not exist yet, create it
					else {
						result[key] = parseMessage({
							key,
							value: json[key],
							languageTag: tag,
						});
					}
				}
			} catch (error) {
				// ignore if file does not exist => no translations exist yet.
				if ((error as any)?.code !== "ENOENT") {
					throw error;
				}
			}
		}
		return Object.values(result) as any;
	},
	saveMessages: async ({ settings, nodeishFs, messages }) => {
		const result: Record<LanguageTag, Record<string, string>> = {};
		for (const message of messages) {
			const serialized = serializeMessage(message);
			for (const [languageTag, value] of Object.entries(serialized)) {
				if (result[languageTag] === undefined) {
					result[languageTag] = {};
				}
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				result[languageTag]![message.id] = value;
			}
		}
		for (const [languageTag, messages] of Object.entries(result)) {
			const path = settings["plugin.inlang.messageFormat"].pathPattern.replace(
				"{languageTag}",
				languageTag
			);
			await createDirectoryIfNotExits({ path, nodeishFs });
			await nodeishFs.writeFile(
				settings["plugin.inlang.messageFormat"].pathPattern.replace(
					"{languageTag}",
					languageTag
				),
				// default to tab indentation
				// PS sorry for anyone who reads this code
				((data: object) => JSON.stringify(data, undefined, "\t"))({
					$schema: "https://inlang.com/schema/inlang-message-format",
					...messages,
				} satisfies StorageSchema)
			);
		}
	},
};

const createDirectoryIfNotExits = async (args: {
	path: string;
	nodeishFs: NodeishFilesystemSubset;
}) => {
	try {
		await args.nodeishFs.mkdir(dirname(args.path), { recursive: true });
	} catch {
		// assume that the directory already exists
	}
};

/**
 * Function extracted from https://www.npmjs.com/package/path-browserify
 */
function dirname(path: string) {
	if (path.length === 0) return ".";
	let code = path.charCodeAt(0);
	const hasRoot = code === 47; /*/*/
	let end = -1;
	let matchedSlash = true;
	for (let i = path.length - 1; i >= 1; --i) {
		code = path.charCodeAt(i);
		if (code === 47 /*/*/) {
			if (!matchedSlash) {
				end = i;
				break;
			}
		} else {
			// We saw the first non-path separator
			matchedSlash = false;
		}
	}

	if (end === -1) return hasRoot ? "/" : ".";
	if (hasRoot && end === 1) return "//";
	return path.slice(0, end);
}

const maybeMigrateToV2 = async (args: {
	nodeishFs: NodeishFilesystemSubset;
	settings: any;
}) => {
	if (args.settings["plugin.inlang.messageFormat"].filePath == undefined) {
		return;
	}
	try {
		const file = await args.nodeishFs.readFile(
			args.settings["plugin.inlang.messageFormat"].filePath,
			{
				encoding: "utf-8",
			}
		);
		await plugin.saveMessages?.({
			messages: JSON.parse(file)["data"],
			nodeishFs: args.nodeishFs,
			settings: args.settings,
		});
		// eslint-disable-next-line no-console
		console.log(
			"Migration to v2 of the inlang-message-format plugin was successful. Please delete the old messages.json file and the filePath property in the settings file of the project."
		);
	} catch {
		// we assume that the file does not exist any more
	}
};
