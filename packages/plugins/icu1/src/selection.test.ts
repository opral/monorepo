import { describe, expect, it } from "vitest";
import type {
  Bundle,
  Declaration,
  Message,
  Pattern,
  Variant,
  VariantImport,
} from "@inlang/sdk";
import { IntlMessageFormat } from "intl-messageformat";
import { parseMessage } from "./parse.js";
import { serializeMessage } from "./serialize.js";

const locale = "en";

/**
 * Expects the imported variants to select what ICU selects: for every
 * combination of `values`, the variant MessageFormat 2 picks displays what
 * the source displays.
 */
function expectSameSelection(
  source: string,
  values: Record<string, unknown>[],
) {
  const sourceFormat = new IntlMessageFormat(source, locale);
  const imported = importMessage(source);
  for (const combination of values) {
    expect(
      displaySelected(imported, combination),
      `${source} with ${JSON.stringify(combination)}`,
    ).toBe(sourceFormat.format(combination));
  }
}

/**
 * Expects the imported variants to select what ICU selects, the export and
 * a second export to display what the source displays, and the second
 * export to be byte-identical. Returns the export.
 */
function expectSameDisplay(
  source: string,
  values: Record<string, unknown>[],
): string {
  expectSameSelection(source, values);
  const exported = serializeMessage(importMessage(source));
  const again = serializeMessage(importMessage(exported));
  expect(again, `${source} -> ${exported}`).toBe(exported);
  const sourceFormat = new IntlMessageFormat(source, locale);
  const exportFormat = new IntlMessageFormat(exported, locale);
  for (const combination of values) {
    expect(
      exportFormat.format(combination),
      `${source} -> ${exported} with ${JSON.stringify(combination)}`,
    ).toBe(sourceFormat.format(combination));
  }
  return exported;
}

function importMessage(source: string): {
  bundle: Bundle;
  message: Message;
  variants: Variant[];
} {
  const parsed = parseMessage({
    messageSource: source,
    bundleId: "bundle",
    locale,
  });
  return {
    bundle: { id: "bundle", declarations: parsed.declarations },
    message: {
      id: "message",
      bundleId: "bundle",
      locale,
      selectors: parsed.selectors,
    },
    variants: parsed.variants.map((variant: VariantImport, index) => ({
      id: `variant-${index}`,
      messageId: "message",
      matches: variant.matches ?? [],
      pattern: variant.pattern ?? [],
    })),
  };
}

/**
 * Displays the variant MessageFormat 2 selects: variants match by each
 * selector in selector order, a literal key before a catch-all, an exact
 * number before a plural category.
 */
function displaySelected(
  imported: { bundle: Bundle; message: Message; variants: Variant[] },
  values: Record<string, unknown>,
): string | undefined {
  const declarations = imported.bundle.declarations;
  const rankers = imported.message.selectors.map((selector) => ({
    name: selector.name,
    rank: keyRanker(selector.name, declarations, values),
  }));
  let best: Variant | undefined;
  let bestRank: number[] | undefined;
  for (const variant of imported.variants) {
    const rank: number[] = [];
    let applies = true;
    for (const { name, rank: rankOf } of rankers) {
      const match = variant.matches.find((entry) => entry.key === name);
      if (!match || match.type === "catchall-match") {
        rank.push(Number.MAX_SAFE_INTEGER);
        continue;
      }
      const value = rankOf(match.value);
      if (value === -1) {
        applies = false;
        break;
      }
      rank.push(value);
    }
    if (!applies) continue;
    if (!bestRank || compareRanks(rank, bestRank) < 0) {
      best = variant;
      bestRank = rank;
    }
  }
  return best && formatPattern(best.pattern, declarations, values);
}

function compareRanks(left: number[], right: number[]): number {
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return left[index]! - right[index]!;
  }
  return 0;
}

function keyRanker(
  name: string,
  declarations: Declaration[],
  values: Record<string, unknown>,
): (key: string) => number {
  const declaration = declarations.find((entry) => entry.name === name);
  if (declaration?.type !== "local-variable") {
    return (key) => (key === String(values[name]) ? 0 : -1);
  }
  const arg = declaration.value.arg;
  const value =
    arg.type === "variable-reference" ? values[arg.name] : arg.value;
  const annotation = declaration.value.annotation;
  if (annotation?.name !== "plural") {
    return (key) => (key === String(value) ? 0 : -1);
  }
  const option = (optionName: string) => {
    const found = annotation.options.find((entry) => entry.name === optionName);
    return found?.value.type === "literal" ? found.value.value : undefined;
  };
  const category = new Intl.PluralRules(locale, {
    type: option("type") === "ordinal" ? "ordinal" : "cardinal",
  }).select(Number(value) - Number(option("offset") ?? 0));
  return (key) => (key === category ? 0 : -1);
}

function formatPattern(
  pattern: Pattern,
  declarations: Declaration[],
  values: Record<string, unknown>,
): string {
  const numberFormat = new Intl.NumberFormat(locale);
  return pattern
    .map((part) => {
      if (part.type === "text") return part.value;
      if (part.type !== "expression" || part.arg.type !== "variable-reference")
        throw new Error(`Unexpected pattern part ${JSON.stringify(part)}`);
      expect(declarations.map((entry) => entry.name)).toContain(part.arg.name);
      const value = values[part.arg.name];
      const annotation = part.annotation;
      if (!annotation) return String(value);
      if (annotation.type !== "function-reference")
        throw new Error(`Unexpected annotation ${JSON.stringify(annotation)}`);
      if (annotation.name === "number")
        return numberFormat.format(value as number);
      if (annotation.name === "icu:pound") {
        const offset = annotation.options.find(
          (entry) => entry.name === "offset",
        )?.value;
        return numberFormat.format(
          Number(value) - Number(offset?.type === "literal" ? offset.value : 0),
        );
      }
      throw new Error(`Unexpected function ${annotation.name}`);
    })
    .join("");
}

function combinations(
  values: Record<string, unknown[]>,
): Record<string, unknown>[] {
  return Object.entries(values).reduce<Record<string, unknown>[]>(
    (result, [name, options]) =>
      result.flatMap((combination) =>
        options.map((option) => ({ ...combination, [name]: option })),
      ),
    [{}],
  );
}

const counts = [0, 1, 2, 5, 21, 1.5];

describe("a selector nested in a less specific case and ahead of it", () => {
  it("selects a select nested in a plural in other of a select on its argument", () => {
    // `g=a, n=*` came before `g=*, n=one`, by `g`
    const exported = expectSameDisplay(
      "{g, select, b {B} other {{n, plural, one {X} other {{g, select, a {A} other {O}}}}}}",
      combinations({ g: ["a", "b", "c"], n: counts }),
    );
    expect(exported).toBe(
      "{g, select, b {B} a {{n, plural, one {X} other {A}}} other {{n, plural, one {X} other {O}}}}",
    );
  });

  it("selects a select that a following select on another argument nests", () => {
    // `g` is ahead of `h`: the first select on `g` encloses one on `h`
    expectSameDisplay(
      "{g, select, other {{h, select, a {A} other {-}}}}{h, select, a {} other {{g, select, b {B} other {O}}}}",
      combinations({ g: ["a", "b", "c"], h: ["a", "b", "c"] }),
    );
  });

  it("selects a plural nested in other of a select ahead of it", () => {
    // `n` is ahead of `g`: it encloses the select on `g` in `h=a`
    expectSameDisplay(
      "{h, select, a {{n, plural, one {{g, select, a {X} other {Y}}} other {Z}}} other {{g, select, a {A} other {{n, plural, one {N1} other {N}}}}}}",
      combinations({ h: ["a", "b"], g: ["a", "b"], n: counts }),
    );
  });

  it("selects an exact match nested in other of a select ahead of it", () => {
    // `g=*, n=5` came before `g=b, n=*`, by the exact selector of `n`. The
    // export of the message lacks `other` in the select in `one`, as before.
    expectSameSelection(
      "{h, select, a {{n, plural, other {{g, select, other {x}}}}} other {{g, select, b {{n, plural, one {one} other {# items}}} other {{n, plural, =5 {five} other {many}}}}}}",
      combinations({ h: ["a", "b"], g: ["a", "b", "c"], n: counts }),
    );
  });
});

/** mulberry32 */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Place = "outside" | "plural" | "select in plural";

/**
 * Generates messages with selects on g and h and plurals on n and m nested
 * in any order, so that selects and plurals on an argument sit at different
 * levels, in and around the ones on other arguments. ICU reads # in a
 * select nested in a plural as literal text, unlike the import, so it is not
 * generated there.
 */
function messageGenerator(
  seed: number,
  options: {
    /** Plurals on an argument only once, and literal "#" not at all. */
    exportable: boolean;
  },
): () => string {
  const random = seededRandom(seed);
  const pick = <T>(choices: T[]): T =>
    choices[Math.floor(random() * choices.length)]!;
  let plurals = new Set<string>();
  const generate = (depth: number, place: Place): string => {
    const expression = () =>
      place === "plural" && random() < 0.5 ? "#" : pick(["{x}", "{n, number}"]);
    let result = expression();
    for (let part = 1 + Math.floor(random() * 2); part > 0; part--) {
      const args = ["g", "h", "n", "m"].filter((arg) => !plurals.has(arg));
      if (depth === 0 || random() < 0.3) {
        const hash = options.exportable
          ? "c"
          : { outside: "#", plural: "'#'", "select in plural": "c" }[place];
        result += pick(["a", " b ", hash]) + expression();
        continue;
      }
      const arg = pick(args);
      if (arg === "g" || arg === "h") {
        const keys = ["a", "b"].filter(() => random() < 0.6);
        const inCase: Place =
          place === "outside" ? "outside" : "select in plural";
        result += `{${arg}, select, ${[...keys, "other"]
          .map((key) => `${key} {${generate(depth - 1, inCase)}}`)
          .join(" ")}}`;
      } else {
        if (options.exportable) plurals.add(arg);
        const offset = arg === "m" && random() < 0.5 ? " offset:1" : "";
        const keys = ["=0", "=1", "=5", "one"].filter(() => random() < 0.4);
        // a plural with an offset and only `other` is how `#` with an offset
        // outside of its plural exports
        if (offset && keys.length === 0) keys.push("one");
        result += `{${arg}, plural,${offset} ${[...keys, "other"]
          .map((key) => `${key} {${generate(depth - 1, "plural")}}`)
          .join(" ")}}`;
      }
    }
    return result;
  };
  return () => {
    // large messages take long to check and to read
    for (;;) {
      plurals = new Set();
      const message = generate(3, "outside");
      if (message.length <= 500) return message;
    }
  };
}

const fuzzValues = combinations({
  g: ["a", "b", "c"],
  h: ["a", "b", "c"],
  n: counts,
  m: counts,
  x: ["X"],
});

describe("nested selects and plurals with repeated arguments (seeded)", () => {
  it("selects what ICU selects", { timeout: 120_000 }, () => {
    const generate = messageGenerator(4479, { exportable: false });
    for (let i = 0; i < 300; i++) {
      expectSameSelection(generate(), fuzzValues);
    }
  });

  it("exports what it imports, the same again", { timeout: 120_000 }, () => {
    // Repeated plurals on an argument and literal "#" next to plurals have
    // export problems of their own.
    const generate = messageGenerator(4480, { exportable: true });
    for (let i = 0; i < 300; i++) {
      expectSameDisplay(generate(), fuzzValues);
    }
  });
});
