import type {
	Declaration as SdkDeclaration,
	InlangPlugin,
	Match,
	Pattern as SdkPattern,
	VariableReference,
} from "@inlang/sdk";
import type { PluginSettings } from "../settings.js";
import { PLUGIN_KEY } from "../pluginKey.js";
import { createMessageId } from "./messageId.js";
import { parseNextIntlMessage } from "./icu.js";

type Pattern = Array<
	| { type: "text"; value: string }
	| {
			type: "expression";
			arg: { type: "variable-reference"; name: string };
			annotation?: undefined;
	  }
>;
type BundleImport = { id: string; declarations: SdkDeclaration[] };
type MessageImport = {
	id?: string;
	bundleId: string;
	locale: string;
	selectors: VariableReference[];
};
type VariantImport = {
	id?: undefined;
	messageId?: undefined;
	messageBundleId: string;
	messageLocale: string;
	matches: Match[];
	pattern: SdkPattern;
};

export const importFiles: NonNullable<
	InlangPlugin<{ [PLUGIN_KEY]: PluginSettings }>["importFiles"]
> = async ({
	files,
	settings,
}): Promise<{
	bundles: BundleImport[];
	messages: MessageImport[];
	variants: VariantImport[];
}> => {
	const bundles = new Map<string, BundleImport>();
	const messages: MessageImport[] = [];
	const variants: VariantImport[] = [];
	const variableReferencePattern = settings?.[PLUGIN_KEY]
		?.variableReferencePattern ?? ["{", "}"];

	for (const file of files) {
		const namespace = file.toBeImportedFilesMetadata?.namespace;
		const resource = flattenMessages(
			JSON.parse(new TextDecoder().decode(file.content))
		);

		for (const { key, path, value } of resource) {
			const bundleId = namespace ? `${namespace}.${key}` : key;
			const parsed = isIcu(variableReferencePattern)
				? parseMessage({ value, bundleId, locale: file.locale })
				: parseLegacyMessage(value, variableReferencePattern);
			const existingBundle = bundles.get(bundleId);

			if (existingBundle === undefined) {
				bundles.set(bundleId, {
					id: bundleId,
					declarations: uniqueDeclarations(parsed.declarations),
				});
			} else {
				existingBundle.declarations = uniqueDeclarations([
					...existingBundle.declarations,
					...parsed.declarations,
				]);
			}

			messages.push({
				id: createMessageId({
					locale: file.locale,
					bundleId,
					path,
				}),
				bundleId,
				locale: file.locale,
				selectors: parsed.selectors,
			});
			for (const variant of parsed.variants) {
				variants.push({
					messageBundleId: bundleId,
					messageLocale: file.locale,
					matches: variant.matches,
					pattern: variant.pattern,
				});
			}
		}
	}

	return {
		bundles: Array.from(bundles.values()),
		messages,
		variants,
	};
};

/**
 * next-intl messages are ICU MessageFormat. A custom `variableReferencePattern`
 * (e.g. `{{` `}}`) predates that: such projects keep reading messages as text
 * with variable references.
 */
export function isIcu(variableReferencePattern: string[]): boolean {
	return (
		variableReferencePattern.length === 2 &&
		variableReferencePattern[0] === "{" &&
		variableReferencePattern[1] === "}"
	);
}

type ParsedMessage = {
	declarations: SdkDeclaration[];
	selectors: VariableReference[];
	variants: Array<{ matches: Match[]; pattern: SdkPattern }>;
};

function parseMessage(args: {
	value: string;
	bundleId: string;
	locale: string;
}): ParsedMessage {
	try {
		const parsed = parseNextIntlMessage({
			messageSource: args.value,
			bundleId: args.bundleId,
			locale: args.locale,
		});
		return {
			declarations: parsed.declarations,
			selectors: parsed.selectors,
			variants: parsed.variants.map((variant) => ({
				matches: variant.matches ?? [],
				pattern: variant.pattern ?? [],
			})),
		};
	} catch {
		// Not valid ICU, next-intl can't render it either (it shows the key):
		// the message is its text, so that loading the project doesn't fail.
		// An unchanged message keeps its text on export.
		return {
			declarations: [],
			selectors: [],
			variants: [
				{ matches: [], pattern: [{ type: "text", value: args.value }] },
			],
		};
	}
}

function parseLegacyMessage(
	value: string,
	variableReferencePattern: string[]
): ParsedMessage {
	const pattern = parsePattern(value, variableReferencePattern);
	return {
		declarations: pattern
			.filter(
				(part): part is Extract<Pattern[number], { type: "expression" }> =>
					part.type === "expression"
			)
			.map((part) => ({
				type: "input-variable" as const,
				name: part.arg.name,
			})),
		selectors: [],
		variants: [{ matches: [], pattern }],
	};
}

function flattenMessages(json: unknown): Array<{
	key: string;
	path: string[];
	value: string;
}> {
	const result: Array<{ key: string; path: string[]; value: string }> = [];

	function visit(value: unknown, path: string[]) {
		if (typeof value === "string") {
			result.push({
				key: path.join("."),
				path,
				value,
			});
			return;
		}

		if (
			value !== null &&
			typeof value === "object" &&
			Array.isArray(value) === false
		) {
			for (const [key, nestedValue] of Object.entries(value)) {
				visit(nestedValue, [...path, key]);
			}
		}
	}

	visit(json, []);
	return result;
}

function parsePattern(
	text: string,
	variableReferencePattern: string[]
): Pattern {
	const opening = variableReferencePattern[0] ?? "{";
	const closing = variableReferencePattern[1] ?? "";
	const expression = closing
		? new RegExp(
				`(${escapeRegExp(opening)}[\\s\\S]+?${escapeRegExp(closing)})`,
				"g"
			)
		: new RegExp(`(${escapeRegExp(opening)}\\w+)`, "g");

	return text
		.split(expression)
		.filter((element) => element !== "")
		.map((element) => {
			if (isVariableReference(element, opening, closing)) {
				return {
					type: "expression",
					arg: {
						type: "variable-reference",
						name: closing
							? element.slice(opening.length, -closing.length)
							: element.slice(opening.length),
					},
				};
			}
			return {
				type: "text",
				value: element,
			};
		});
}

function isVariableReference(
	text: string,
	opening: string,
	closing: string
): boolean {
	return closing
		? text.startsWith(opening) &&
				text.endsWith(closing) &&
				text.length > opening.length + closing.length
		: text.startsWith(opening) && text.length > opening.length;
}

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueDeclarations(
	declarations: BundleImport["declarations"]
): BundleImport["declarations"] {
	const result = new Map<string, BundleImport["declarations"][number]>();
	for (const declaration of declarations) {
		const key = JSON.stringify(declaration);
		if (!result.has(key)) result.set(key, declaration);
	}
	return Array.from(result.values());
}
