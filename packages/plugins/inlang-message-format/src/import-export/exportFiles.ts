import type {
	Bundle,
	Declaration,
	ExportFile,
	Match,
	Message,
	VariableReference,
	Variant,
} from "@inlang/sdk";
import { type plugin } from "../plugin.js";
import type {
	ComplexMessage,
	FileSchema,
	SimpleMessage,
} from "../fileSchema.js";
import { unflatten } from "flat";
import { sortMessageKeys } from "../utils/sortKeys.js";

export const exportFiles: NonNullable<(typeof plugin)["exportFiles"]> = async ({
	bundles,
	messages,
	variants,
	settings,
}) => {
	const files: Record<string, FileSchema> = {};

	for (const message of messages) {
		const bundle = bundles.find((b) => b.id === message.bundleId);
		const variantsOfMessage = [
			...variants
				.reduce((r, v) => {
					if (v.messageId === message.id) r.set(JSON.stringify(v.matches), v);
					return r;
				}, new Map<string, (typeof variants)[number]>())
				.values(),
		];
		files[message.locale] = {
			...files[message.locale],
			...serializeMessage(bundle!, message, variantsOfMessage),
		};
	}

	const result: ExportFile[] = [];

	for (const locale in files) {
		const sortDirection =
			settings?.["plugin.inlang.messageFormat"]?.sort ?? undefined;
		const unflattened = unflatten(files[locale]) as Record<string, unknown>;
		const sortedMessages: Record<string, unknown> = sortDirection
			? sortMessageKeys(unflattened, sortDirection)
			: unflattened;
		result.push({
			locale,
			// beautify the json
			content: new TextEncoder().encode(
				JSON.stringify(
					{
						// increase DX by providing auto complete in IDEs
						$schema: "https://inlang.com/schema/inlang-message-format",
						...sortedMessages,
					},
					undefined,
					"\t"
				)
			),
			name: locale + ".json",
		});
	}

	return result;
};

function serializeMessage(
	bundle: Bundle,
	message: Message,
	variants: Variant[]
): Record<string, SimpleMessage | ComplexMessage> {
	const key = message.bundleId;
	const value = serializeVariants(bundle, message, variants);
	return { [key]: value };
}

function serializeVariants(
	bundle: Bundle,
	message: Message,
	variants: Variant[]
): SimpleMessage | ComplexMessage {
	// single variant
	if (variants.length === 1) {
		if (
			message.selectors.length === 0 &&
			bundle.declarations.some((d) => d.type !== "input-variable") === false
		) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return serializePattern(variants[0]!.pattern);
		}
	}

	const entries = [];
	for (const variant of variants) {
		if (variant.matches.length === 0) {
			for (const part of variant.pattern) {
				if (
					part.type === "expression" &&
					part.arg.type === "variable-reference"
				) {
					variant.matches.push({ key: part.arg.name, type: "catchall-match" });
				}
			}
		}

		const pattern = serializePattern(variant.pattern);
		const match = serializeMatcher(variant.matches);
		entries.push([match, pattern]);
	}

	return [
		{
			// naively adding all declarations, even if unused in the variants
			// can be optimized later.
			declarations: bundle.declarations
				.sort((a, b) => a.name.localeCompare(b.name))
				.map(serializeDeclaration)
				.sort(),
			selectors: message.selectors.map((s) => s.name).sort(),
			match: Object.fromEntries(entries),
		},
	];
}

function serializePattern(pattern: Variant["pattern"]): string {
	let result = "";

	for (const part of pattern) {
		if (part.type === "text") {
			result += escapePatternText(part.value);
		} else if (part.arg.type === "variable-reference") {
			result += `{${part.arg.name}}`;
		} else {
			throw new Error("Unsupported expression type");
		}
	}
	return result;
}

function escapePatternText(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/{/g, "\\{").replace(/}/g, "\\}");
}

// input: { platform: "android", userGender: "male" }
// output: `platform=android,userGender=male`
function serializeMatcher(matches: Match[]): string {
	const parts = matches
		.sort((a, b) => a.key.localeCompare(b.key))
		.map((match) =>
			match.type === "literal-match"
				? `${match.key}=${match.value}`
				: `${match.key}=*`
		);

	return parts.join(", ");
}

function serializeDeclaration(declaration: Declaration): string {
	if (declaration.type === "input-variable") {
		return `input ${declaration.name}`;
	} else if (declaration.type === "local-variable") {
		let result = "";
		if (declaration.value.arg.type === "variable-reference") {
			result = `local ${declaration.name} = ${declaration.value.arg.name}`;
		} else if (declaration.value.arg.type === "literal") {
			result = `local ${declaration.name} = "${declaration.value.arg.value}"`;
		}
		if (declaration.value.annotation) {
			result += `: ${declaration.value.annotation.name}`;
		}
		if (declaration.value.annotation?.options) {
			for (const option of declaration.value?.annotation?.options ?? []) {
				if (option.value.type !== "literal") {
					throw new Error("Unsupported option type");
				}
				result += ` ${option.name}=${option.value.value}`;
			}
		}
		return result;
	}
	throw new Error("Unsupported declaration type");
}
