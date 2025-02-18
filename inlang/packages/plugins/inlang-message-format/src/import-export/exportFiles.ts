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
import type { FileSchema } from "../fileSchema.js";

export const exportFiles: NonNullable<(typeof plugin)["exportFiles"]> = async ({
	bundles,
	messages,
	variants,
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
		result.push({
			locale,
			// beautify the json
			content: new TextEncoder().encode(
				JSON.stringify(
					{
						// increase DX by providing auto complete in IDEs
						$schema: "https://inlang.com/schema/inlang-message-format",
						...files[locale],
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
): Record<string, string | Record<string, string>> {
	const key = message.bundleId;
	const value = serializeVariants(bundle, message, variants);
	return { [key]: value };
}

function serializeVariants(
	bundle: Bundle,
	message: Message,
	variants: Variant[]
): string | Record<string, any> {
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

	return {
		// naively adding all declarations, even if unused in the variants
		// can be optimized later.
		declarations: bundle.declarations.map(serializeDeclaration),
		selectors: message.selectors.map((s) => s.name),
		match: Object.fromEntries(entries),
	};
}

function serializePattern(pattern: Variant["pattern"]): string {
	let result = "";

	for (const part of pattern) {
		if (part.type === "text") {
			result += part.value;
		} else if (part.arg.type === "variable-reference") {
			result += `{${part.arg.name}}`;
		} else {
			throw new Error("Unsupported expression type");
		}
	}
	return result;
}

// input: { platform: "android", userGender: "male" }
// output: `platform=android,userGender=male`
function serializeMatcher(matches: Match[]): string {
	const parts = [];
	for (const match of matches) {
		if (match.type === "literal-match") {
			parts.push(`${match.key}=${match.value}`);
		} else {
			parts.push(`${match.key}=*`);
		}
	}
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
