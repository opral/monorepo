import type {
  Match,
  Variant,
  MessageImport,
  VariantImport,
  Bundle,
  Pattern,
  Declaration,
  VariableReference,
  Message,
} from "@inlang/sdk";
import { type plugin } from "../plugin.js";
import { flatten } from "flat";
import type {
	ComplexMessage,
	ComplexMessageObject,
	SimpleMessage,
} from "../fileSchema.js";

export const importFiles: NonNullable<(typeof plugin)["importFiles"]> = async ({
	files,
}) => {
	const bundles: Bundle[] = [];
	const messages: MessageImport[] = [];
	const variants: VariantImport[] = [];

	for (const file of files) {
		const json = JSON.parse(new TextDecoder().decode(file.content));
		const flattened = flatten(json, { safe: true }) as Record<string, string>;

		for (const key in flattened) {
			if (key === "$schema") {
				continue;
			}
			const result = parseBundle(key, file.locale, flattened[key]!);
			messages.push(result.message);
			variants.push(...result.variants);

			const existingBundle = bundles.find((b) => b.id === result.bundle.id);
			if (existingBundle === undefined) {
				bundles.push(result.bundle);
			} else {
				// merge declarations without duplicates
				existingBundle.declarations = unique([
					...existingBundle.declarations,
					...result.bundle.declarations,
				]);
			}
		}
	}

	return { bundles, messages, variants };
};

function parseBundle(
	key: string,
	locale: string,
	value: SimpleMessage | ComplexMessage
): {
	bundle: Bundle;
	message: MessageImport;
	variants: VariantImport[];
} {
	const parsed = parseVariants(key, locale, value);
	const declarations = unique(parsed.declarations);
	const selectors = unique(parsed.selectors);

	const undeclaredSelectors = selectors.filter(
		(selector) =>
			declarations.find((d) => d.name === selector.name) === undefined
	);

	for (const undeclaredSelector of undeclaredSelectors) {
		declarations.push({
			type: "input-variable",
			name: undeclaredSelector.name,
		});
	}

	return {
		bundle: {
			id: key,
			declarations,
		},
		message: {
			bundleId: key,
			selectors,
			locale: locale,
		},
		variants: parsed.variants,
	};
}

function parseVariants(
	bundleId: string,
	locale: string,
	value: SimpleMessage | ComplexMessage
): {
	variants: VariantImport[];
	declarations: Declaration[];
	selectors: VariableReference[];
} {
	// single variant
	if (typeof value === "string") {
		const parsed = parsePattern(value);
		return {
			variants: [
				{
					messageBundleId: bundleId,
					messageLocale: locale,
					matches: [],
					pattern: parsed.pattern,
				},
			],
			// legacy reasons that input variables are derived from the pattern
			declarations: parsed.declarations,
			selectors: [],
		};
	}
	const complexMessage = value[0]!;
	// multi variant
	const variants: VariantImport[] = [];
	const selectors: VariableReference[] = (
		(complexMessage["selectors"] as string[]) ?? []
	).map((name) => ({
		type: "variable-reference",
		name,
	}));

	const declarations = new Set<Declaration>();

	for (const declaration of complexMessage["declarations"] ??
		([] as string[])) {
		declarations.add(parseDeclaration(declaration));
	}

	const detectedSelectors = new Set<VariableReference>();

	for (const [match, pattern] of Object.entries(complexMessage["match"])) {
		const parsed = parsePattern(pattern);
		const parsedMatches = parseMatches(match);
		for (const declaration of parsed.declarations) {
			let isDuplicate = false;
			for (const existingDeclaration of declarations) {
				if (existingDeclaration.name === declaration.name) {
					isDuplicate = true;
					break;
				}
			}
			if (isDuplicate) {
				break;
			}
			declarations.add(declaration);
		}
		for (const selector of parsedMatches.selectors) {
			detectedSelectors.add(selector);
		}
		variants.push({
			messageBundleId: bundleId,
			messageLocale: locale,
			matches: parsedMatches.matches,
			pattern: parsed.pattern,
		});
	}
	return {
		variants,
		declarations: Array.from(declarations),
		selectors: unique([...selectors, ...Array.from(detectedSelectors)]),
	};
}

function parsePattern(value: string): {
        declarations: Declaration[];
        pattern: Pattern;
} {
        const pattern: Variant["pattern"] = [];
        const declarations: Declaration[] = [];

        let buffer = "";
        let i = 0;
        while (i < value.length) {
                const char = value[i]!;

                if (char === "\\") {
                        const next = value[i + 1];
                        if (next === "{" || next === "}" || next === "\\") {
                                buffer += next;
                                i += 2;
                                continue;
                        }
                        buffer += char;
                        i++;
                        continue;
                }

                if (char === "{") {
                        // flush text buffer
                        if (buffer !== "") {
                                pattern.push({ type: "text", value: buffer });
                                buffer = "";
                        }

                        let j = i + 1;
                        let expression = "";
                        while (j < value.length && value[j] !== "}") {
                                expression += value[j];
                                j++;
                        }

                        if (j < value.length && value[j] === "}") {
                                const variableName = expression;
                                declarations.push({
                                        type: "input-variable",
                                        name: variableName,
                                });
                                pattern.push({
                                        type: "expression",
                                        arg: { type: "variable-reference", name: variableName },
                                });
                                i = j + 1;
                                continue;
                        }

                        // unmatched '{', treat as text
                        buffer += "{" + expression;
                        i = j;
                        continue;
                }

                buffer += char;
                i++;
        }

        if (buffer !== "") {
                pattern.push({ type: "text", value: buffer });
        }

        return {
                declarations,
                pattern,
        };
}

// input: `platform=android,userGender=male`
// output: { platform: "android", userGender: "male" }
function parseMatches(value: string): {
	matches: Match[];
	selectors: Message["selectors"];
} {
	const stripped = value.replace(" ", "");

	const matches: Match[] = [];
	const selectors: Message["selectors"] = [];

	const parts = stripped.split(",");
	for (const part of parts) {
		const [key, value] = part.split("=");
		if (!key || !value) {
			continue;
		}
		if (value === "*") {
			matches.push({
				type: "catchall-match",
				key: key,
			});
		} else {
			matches.push({
				type: "literal-match",
				key,
				value,
			});
		}
		selectors.push({
			type: "variable-reference",
			name: key,
		});
	}
	return { matches, selectors };
}

const unique = (arr: Array<any>) =>
	[...new Set(arr.map((item) => JSON.stringify(item)))].map((item) =>
		JSON.parse(item)
	);

function parseDeclaration(value: string): Declaration {
	if (value.startsWith("input")) {
		return {
			type: "input-variable",
			name: value.slice(6).trim(),
		};
	}
	// local countPlural = count : plural
	else if (value.startsWith("local")) {
		const match = value.match(/local (\w+) = (\w+): (\w+)(.*)/);
		const [, name, ref, fn, optionsString] = match!;
		// TODO handle variable reference options
		const options = optionsString
			?.trim()
			.split(/\s+/)
			.map((pair) => {
				const [key, value] = pair.split("=");
				return key && value
					? {
							name: key,
							value: { type: "literal", value },
						}
					: null;
			})
			.filter(Boolean) as {
			name: string;
			value: { type: "literal"; value: string };
		}[];

		return {
			type: "local-variable",
			name: name!.trim(),
			value: {
				type: "expression",
				arg: {
					type: "variable-reference",
					name: ref!.trim(),
				},
				annotation: fn
					? {
							type: "function-reference",
							name: fn.trim(),
							options: options ?? [],
						}
					: undefined,
			},
		};
	}
	throw new Error("Unsupported declaration type");
}
