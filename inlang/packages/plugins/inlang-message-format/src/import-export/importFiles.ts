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

export const importFiles: NonNullable<(typeof plugin)["importFiles"]> = async ({
  files,
}) => {
  const bundles: Bundle[] = [];
  const messages: MessageImport[] = [];
  const variants: VariantImport[] = [];

  for (const file of files) {
    const json = JSON.parse(new TextDecoder().decode(file.content));

    for (const key in json) {
      if (key === "$schema") {
        continue;
      }
      const result = parseBundle(key, file.locale, json[key]);
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
  value: string | Record<string, string>,
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
      declarations.find((d) => d.name === selector.name) === undefined,
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
  value: string | Record<string, string | string[]>,
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
  // multi variant
  const variants: VariantImport[] = [];
  const selectors: VariableReference[] = (
    (value["selectors"] as string[]) ?? []
  ).map((name) => ({
    type: "variable-reference",
    name,
  }));

  const declarations = new Set<Declaration>();

  for (const declaration of value["declarations"] ?? ([] as string[])) {
    declarations.add(parseDeclaration(declaration));
  }

  const detectedSelectors = new Set<VariableReference>();

  for (const [match, pattern] of Object.entries(value["match"] as string)) {
    const parsed = parsePattern(pattern);
    const parsedMatches = parseMatches(match);
    for (const declaration of parsed.declarations) {
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

  // splits a pattern like "Hello {name}!" into an array of parts
  // "hello {name}, how are you?" -> ["hello ", "{name}", ", how are you?"]
  const parts = value.split(/(\{.*?\})/).filter((part) => part !== "");

  for (const part of parts) {
    // it's text
    if ((part.startsWith("{") && part.endsWith("}")) === false) {
      pattern.push({ type: "text", value: part });
    }
    // it's an expression (only supporting variables for now)
    else {
      const variableName = part.slice(1, -1);
      declarations.push({
        type: "input-variable",
        name: variableName,
      });
      pattern.push({
        type: "expression",
        arg: { type: "variable-reference", name: variableName },
      });
    }
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
    JSON.parse(item),
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
    // ["countPlural", "count : plural"]
    const [name, expression] = value.trim().slice(6).split("=");
    if (name === undefined || expression === undefined) {
      throw new Error("Local variable must have a name and an expression");
    }
    // ["count", "plural"]
    const [refName, maybeFunctionName] = expression.split(":");
    if (refName === undefined) {
      throw new Error("Referenced variable name is undefined");
    }
    return {
      type: "local-variable",
      name: name.trim(),
      value: {
        type: "expression",
        arg: {
          type: "variable-reference",
          name: refName.trim(),
        },
        annotation: maybeFunctionName
          ? {
              type: "function-reference",
              name: maybeFunctionName.trim(),
              options: [],
            }
          : undefined,
      },
    };
  }
  throw new Error("Unsupported declaration type");
}
