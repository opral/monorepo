import type {
	Bundle as SdkBundle,
	InlangPlugin,
	Message as SdkMessage,
	Variant as SdkVariant,
} from "@inlang/sdk";
import type { PluginSettings } from "../settings.js";
import { PLUGIN_KEY } from "../pluginKey.js";
import { keepUnchangedJsonEntries } from "@inlang/sdk/json-formatting";
import { getMessagePath } from "./messageId.js";
import { importFiles, isIcu } from "./importFiles.js";
import { serializeNextIntlMessage } from "./icu.js";

type Pattern = Array<
	| { type: "text"; value: string }
	| {
			type: "expression";
			arg:
				| { type: "variable-reference"; name: string }
				| { type: "literal"; value: string };
			annotation?: unknown;
	  }
	| { type: "markup-start"; name: string }
	| { type: "markup-end"; name: string }
	| { type: "markup-standalone"; name: string }
>;
type Bundle = SdkBundle;
type Message = SdkMessage;
type Variant = SdkVariant;

type ExportFiles = NonNullable<
	InlangPlugin<{ [PLUGIN_KEY]: PluginSettings }>["exportFiles"]
>;

/**
 * Writes the files and keeps the text of the entries of the previous files
 * (`files`) that didn't change.
 */
export const exportFiles: ExportFiles = async (args) =>
	keepUnchangedJsonEntries({
		exported: await exportWholeFiles(args),
		files: args.files,
		settings: args.settings,
		importFiles,
		exportFiles: exportWholeFiles,
	});

/**
 * Writes whole files, without the previous files.
 */
const exportWholeFiles: ExportFiles = async ({
	bundles,
	messages,
	variants,
	settings,
}): Promise<
	Array<{
		locale: string;
		content: Uint8Array;
		name: string;
		metadata?: Record<string, any>;
	}>
> => {
	const result: Record<string, Array<ExportMessage>> = {};
	const resultNamespaces: Record<
		string,
		Record<string, Array<ExportMessage>>
	> = {};
	const pluginSettings = settings?.[PLUGIN_KEY];
	const namespaces =
		pluginSettings && typeof pluginSettings.pathPattern === "object"
			? Object.keys(pluginSettings.pathPattern)
			: [];
	const icu = isIcu(pluginSettings?.variableReferencePattern ?? ["{", "}"]);

	const bundlesById = new Map(
		(bundles as Bundle[]).map((bundle) => [bundle.id, bundle])
	);
	const variantsByMessageId = new Map<string, Variant[]>();
	for (const variant of variants as Variant[]) {
		const variantsOfMessage = variantsByMessageId.get(variant.messageId) ?? [];
		variantsOfMessage.push(variant);
		variantsByMessageId.set(variant.messageId, variantsOfMessage);
	}

	// The path of each bundle's entry in its file, from a message the project
	// imported: a new message of the bundle (e.g. of another locale) goes to
	// the same place, e.g. to the key with a dot of `{ "a": { "b.c": "…" } }`.
	const importedPaths = new Map<string, string[]>();
	for (const message of messages as Message[]) {
		const bundle = bundlesById.get(message.bundleId);
		if (bundle === undefined || importedPaths.has(bundle.id)) {
			continue;
		}
		const namespace = resolveNamespaceFromBundleId(bundle.id, namespaces);
		const path = getCurrentMessagePath({
			messageId: message.id,
			currentKey:
				namespace === undefined
					? bundle.id
					: removeNamespaceFromBundleId(bundle.id, namespace),
		});
		if (path !== undefined) {
			importedPaths.set(bundle.id, path);
		}
	}
	/**
	 * Where the entry of a message goes. next-intl reads `t("a.b")` from
	 * `{ "a": { "b": "…" } }` (keys can't contain dots), so a new message
	 * is nested at the dots of its key.
	 */
	const pathOf = (message: Message, bundle: Bundle, key: string) => {
		const path =
			getCurrentMessagePath({ messageId: message.id, currentKey: key }) ??
			importedPaths.get(bundle.id);
		return path === undefined
			? { path: key.split("."), isNew: true }
			: { path, isNew: false };
	};

	for (const message of messages as Message[]) {
		const bundle = bundlesById.get(message.bundleId);
		if (bundle === undefined) {
			continue;
		}

		const variantsOfMessage = variantsByMessageId.get(message.id) ?? [];
		if (variantsOfMessage.length === 0) {
			continue;
		}
		const value = icu
			? serializeNextIntlMessage({
					bundle,
					message,
					variants: variantsOfMessage,
				})
			: serializePattern(
					variantsOfMessage[0]!.pattern as Pattern,
					pluginSettings
				);
		const namespace = resolveNamespaceFromBundleId(bundle.id, namespaces);

		if (namespace === undefined) {
			result[message.locale] ??= [];
			result[message.locale]!.push({
				key: bundle.id,
				...pathOf(message, bundle, bundle.id),
				value,
			});
		} else {
			const key = removeNamespaceFromBundleId(bundle.id, namespace);
			resultNamespaces[namespace] ??= {};
			resultNamespaces[namespace]![message.locale] ??= [];
			resultNamespaces[namespace]![message.locale]!.push({
				key,
				...pathOf(message, bundle, key),
				value,
			});
		}
	}

	const withoutNamespace = Object.entries(result).map(([locale, messages]) => ({
		locale,
		content: encodeJson(messages),
		name: `${locale}.json`,
	}));
	const withNamespace = Object.entries(resultNamespaces).flatMap(
		([namespace, locales]) =>
			Object.entries(locales).map(([locale, messages]) => ({
				locale,
				content: encodeJson(messages),
				name: `${namespace}-${locale}.json`,
				metadata: {
					namespace,
				},
			}))
	);

	return [
		...withSourceLanguageFilePathMetadata({
			files: withoutNamespace,
			settings,
		}),
		...withNamespace,
	];
};

/** Serializes the pattern of a project with a custom `variableReferencePattern`. */
function serializePattern(pattern: Pattern, settings?: PluginSettings): string {
	let result = "";
	const variableReferencePattern = settings?.variableReferencePattern ?? [
		"{",
		"}",
	];

	for (const part of pattern) {
		switch (part.type) {
			case "text":
				result += part.value;
				break;
			case "expression":
				if (part.arg.type !== "variable-reference") {
					throw new Error("Only variable references are supported.");
				}
				if (part.annotation !== undefined) {
					throw new Error("Annotated expressions are not supported.");
				}
				result += `${variableReferencePattern[0]}${part.arg.name}${
					variableReferencePattern[1] ?? ""
				}`;
				break;
			case "markup-start":
			case "markup-end":
			case "markup-standalone":
				throw new Error("Markup is not supported by the next-intl plugin.");
		}
	}

	return result;
}

function resolveNamespaceFromBundleId(
	bundleId: string,
	namespaces: string[]
): string | undefined {
	return [...namespaces]
		.sort((a, b) => b.length - a.length)
		.find((namespace) => bundleId.startsWith(`${namespace}.`));
}

function removeNamespaceFromBundleId(
	bundleId: string,
	namespace: string
): string {
	return bundleId.replace(`${namespace}.`, "");
}

type ExportMessage = {
	key: string;
	path: string[];
	/** The path is the key's, not one that a file had. */
	isNew: boolean;
	value: string;
};

function encodeJson(messages: ExportMessage[]): Uint8Array {
	return new TextEncoder().encode(
		JSON.stringify(toJson(messages), undefined, "\t") + "\n"
	);
}

function toJson(messages: ExportMessage[]): Record<string, unknown> {
	const imported = messages.filter((message) => !message.isNew);
	const added = messages.filter((message) => message.isNew);
	// the paths of the files first: a new message can't replace them
	const probe: Record<string, unknown> = {};
	for (const message of imported) {
		assignPath(probe, message.path, message.value);
	}
	const fitting: ExportMessage[] = [];
	const conflicting: Record<string, string> = {};
	for (const message of added) {
		if (assignPath(probe, message.path, message.value)) {
			fitting.push(message);
		} else if (
			Object.prototype.hasOwnProperty.call(probe, message.key) === false
		) {
			// e.g. "a.b" while "a" is a message: next-intl can't read it
			// either way, the key stays as it is
			conflicting[message.key] = message.value;
		}
	}

	// new messages first, like before they were nested
	const result: Record<string, unknown> = { ...conflicting };
	for (const message of [...fitting, ...imported]) {
		assignPath(result, message.path, message.value);
	}
	return result;
}

/** Sets `value` at `path`, unless a message or namespace is in the way. */
function assignPath(
	target: Record<string, unknown>,
	path: string[],
	value: string
): boolean {
	let cursor = target;

	for (const [index, segment] of path.entries()) {
		const existing = Object.prototype.hasOwnProperty.call(cursor, segment)
			? cursor[segment]
			: undefined;
		if (index === path.length - 1) {
			if (existing !== undefined && typeof existing !== "string") {
				return false;
			}
			cursor[segment] = value;
			return true;
		}
		if (existing === undefined) {
			cursor[segment] = {};
		} else if (typeof existing !== "object" || existing === null) {
			return false;
		}
		cursor = cursor[segment] as Record<string, unknown>;
	}
	return false;
}

function getCurrentMessagePath(args: {
	messageId: string;
	currentKey: string;
}): string[] | undefined {
	const path = getMessagePath(args.messageId);
	return path?.join(".") === args.currentKey ? path : undefined;
}

function withSourceLanguageFilePathMetadata(args: {
	files: Array<{
		locale: string;
		content: Uint8Array;
		name: string;
		metadata?: Record<string, any>;
	}>;
	settings: Parameters<
		NonNullable<InlangPlugin<{ [PLUGIN_KEY]: PluginSettings }>["exportFiles"]>
	>[0]["settings"];
}) {
	const pluginSettings = args.settings?.[PLUGIN_KEY];
	const sourceLocale =
		args.settings?.baseLocale ?? args.settings?.sourceLanguageTag;

	if (
		pluginSettings === undefined ||
		typeof pluginSettings.pathPattern !== "string" ||
		typeof pluginSettings.sourceLanguageFilePath !== "string" ||
		typeof sourceLocale !== "string"
	) {
		return args.files;
	}

	return args.files.map((file) => ({
		...file,
		metadata:
			file.locale === sourceLocale
				? {
						...file.metadata,
						pathPattern: pluginSettings.sourceLanguageFilePath,
					}
				: file.metadata,
	}));
}
