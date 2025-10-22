import { randomUUID } from "node:crypto";
import {
  Text,
  VariableReference,
  type BundleNested,
  type NewBundleNested,
  type Variant,
} from "@inlang/sdk";

const PRIMARY_API_KEY_ENV = "INLANG_GOOGLE_TRANSLATE_API_KEY";

type MachineTranslateArgs = {
  bundle: BundleNested;
  sourceLocale: string;
  targetLocales: string[];
  googleApiKey?: string;
};

type MachineTranslateResult = {
  data?: NewBundleNested;
  error?: string;
};

/**
 * Machine translates the given bundle using the Google Translate API.
 *
 * The translation updates or creates variants only for missing translations in
 * the requested target locales. Existing non-empty variants are preserved.
 *
 * @example
 *   const result = await machineTranslateBundle({
 *     bundle,
 *     sourceLocale: "en",
 *     targetLocales: ["de"],
 *     googleApiKey: process.env.INLANG_GOOGLE_TRANSLATE_API_KEY,
 *   });
 *   if (result.data) {
 *     await upsertBundleNested(project, result.data);
 *   }
 */
export async function machineTranslateBundle(
  args: MachineTranslateArgs,
): Promise<MachineTranslateResult> {
  try {
    const apiKey =
      args.googleApiKey ?? process.env[PRIMARY_API_KEY_ENV];

    if (!apiKey) {
      return { error: `${PRIMARY_API_KEY_ENV} is not set` };
    }

    const copy = structuredClone(args.bundle);

    const sourceMessage = copy.messages.find(
      (message) => message.locale === args.sourceLocale,
    );

    if (!sourceMessage) {
      return {
        error: `Source locale not found in the bundle: ${args.bundle.id}`,
      };
    }

    for (const sourceVariant of sourceMessage.variants) {
      const sourcePattern = serializePattern(sourceVariant.pattern, {});

      for (const targetLocale of args.targetLocales) {
        if (targetLocale === args.sourceLocale) {
          continue;
        }

        const targetMessage = copy.messages.find(
          (message) => message.locale === targetLocale,
        );

        if (targetMessage) {
          const existingVariant = findMatchingVariant(
            targetMessage.variants,
            sourceVariant.matches,
          );

          if (
            existingVariant &&
            !(
              existingVariant.pattern.length === 0 ||
              (existingVariant.pattern.length === 1 &&
                existingVariant.pattern[0]?.type === "text" &&
                (existingVariant.pattern[0] as Text).value === "")
            )
          ) {
            continue;
          }
        }

        const response = await fetch(
          "https://translation.googleapis.com/language/translate/v2?" +
            new URLSearchParams({
              q: sourcePattern,
              target: targetLocale,
              source: args.sourceLocale,
              format: "html",
              key: apiKey,
            }),
          { method: "POST" },
        );

        if (!response.ok) {
          const err = `${response.status} ${response.statusText}: translating from ${args.sourceLocale} to ${targetLocale}`;
          return { error: err };
        }

        const json = await response.json();
        const pattern = deserializePattern(
          json.data.translations[0].translatedText,
        );

        if (targetMessage) {
          const existingVariant = findMatchingVariant(
            targetMessage.variants,
            sourceVariant.matches,
          );

          if (
            existingVariant &&
            (existingVariant.pattern.length === 0 ||
              (existingVariant.pattern.length === 1 &&
                existingVariant.pattern[0]?.type === "text" &&
                (existingVariant.pattern[0] as Text).value === ""))
          ) {
            existingVariant.pattern = pattern;
          } else {
            targetMessage.variants.push({
              id: randomUUID(),
              messageId: targetMessage.id,
              matches: sourceVariant.matches,
              pattern,
            } satisfies Variant);
          }
        } else {
          const newMessageId = randomUUID();
          copy.messages.push({
            ...sourceMessage,
            id: newMessageId,
            locale: targetLocale,
            variants: [
              {
                id: randomUUID(),
                messageId: newMessageId,
                matches: sourceVariant.matches,
                pattern,
              } satisfies Variant,
            ],
          });
        }
      }
    }

    return { data: copy };
  } catch (error) {
    return { error: error?.toString() ?? "unknown error" };
  }
}

function findMatchingVariant(
  variants: Variant[],
  matches: Variant["matches"],
): Variant | undefined {
  if (matches.length === 0) {
    return variants.find((variant) => variant.matches.length === 0);
  }

  return variants.find((variant) => {
    if (variant.matches.length !== matches.length) {
      return false;
    }

    return matches.every((sourceMatch) =>
      variant.matches.some((targetMatch) => {
        if (
          targetMatch.key !== sourceMatch.key ||
          targetMatch.type !== sourceMatch.type
        ) {
          return false;
        }

        if (
          sourceMatch.type === "literal-match" &&
          targetMatch.type === "literal-match"
        ) {
          return sourceMatch.value === targetMatch.value;
        }

        return true;
      }),
    );
  });
}

type PlaceholderMetadata = Record<
  string,
  {
    leadingCharacter?: string;
    trailingCharacter?: string;
  }
>;

const escapeStart = `<span class="notranslate">`;
const escapeEnd = "</span>";

function serializePattern(
  pattern: Variant["pattern"],
  placeholderMetadata: PlaceholderMetadata,
) {
  let result = "";
  for (const [index, element] of pattern.entries()) {
    if (element.type === "text") {
      result += element.value
        .replaceAll("\r", "<inlang-CarriageReturn>")
        .replaceAll("\n", "<inlang-LineFeed>");
    } else {
      // @ts-expect-error placeholder metadata is keyed by name at runtime
      placeholderMetadata[element.name] = {
        leadingCharacter: result.at(-1) ?? undefined,
        trailingCharacter:
          pattern[index + 1]?.type === "text"
            ? (pattern[index + 1] as Text).value[0]
            : undefined,
      };
      result += `${escapeStart}${JSON.stringify(element)}${escapeEnd}`;
    }
  }
  return result;
}

function deserializePattern(text: string): Variant["pattern"] {
  const result: Variant["pattern"] = [];
  const unescapedText = text
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("<inlang-CarriageReturn>", "\r")
    .replaceAll("<inlang-LineFeed> ", "\n")
    .replaceAll("<inlang-LineFeed>", "\n");
  let index = 0;
  while (index < unescapedText.length) {
    const start = unescapedText.indexOf(escapeStart, index);
    if (start === -1) {
      result.push({ type: "text", value: unescapedText.slice(index) });
      break;
    } else if (index < start) {
      result.push({ type: "text", value: unescapedText.slice(index, start) });
      index = start;
      continue;
    }
    const end = unescapedText.indexOf(escapeEnd, start);
    if (end === -1) {
      result.push({ type: "text", value: unescapedText.slice(index) });
      break;
    }

    const expressionAsText = unescapedText.slice(
      start + escapeStart.length,
      end,
    );
    const expression = JSON.parse(expressionAsText) as VariableReference;

    // @ts-expect-error placeholder metadata is preserved at runtime
    result.push(expression);
    index = end + escapeEnd.length;
  }
  return result;
}
