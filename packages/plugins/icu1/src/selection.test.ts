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
 * a second export to be valid ICU and display what the source displays, and
 * the second export to be byte-identical. Returns the export.
 */
function expectSameDisplay(
  source: string,
  values: Record<string, unknown>[],
  options: { sameAgain: boolean } = { sameAgain: true },
): string {
  expectSameSelection(source, values);
  const exported = serializeMessage(importMessage(source));
  const again = serializeMessage(importMessage(exported));
  if (options.sameAgain) {
    expect(again, `${source} -> ${exported}`).toBe(exported);
  }
  const sourceFormat = new IntlMessageFormat(source, locale);
  for (const output of [exported, again]) {
    const outputFormat = new IntlMessageFormat(output, locale);
    for (const combination of values) {
      expect(
        outputFormat.format(combination),
        `${source} -> ${output} with ${JSON.stringify(combination)}`,
      ).toBe(sourceFormat.format(combination));
    }
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
    // `g=*, n=5` came before `g=b, n=*`, by the exact selector of `n`
    const exported = expectSameDisplay(
      "{h, select, a {{n, plural, other {{g, select, other {x}}}}} other {{g, select, b {{n, plural, one {one} other {# items}}} other {{n, plural, =5 {five} other {many}}}}}}",
      combinations({ h: ["a", "b"], g: ["a", "b", "c"], n: counts }),
    );
    // a case of the plural selects `other` of the select for values its own
    // variants don't match
    expect(exported).toBe(
      "{h, select, a {{n, plural, other {{g, select, other {x}}}}} other {{n, plural, =5 {{g, select, b {{n, number} items} other {five}}} one {{g, select, b {one} other {many}}} other {{g, select, b {{n, number} items} other {many}}}}}}",
    );
  });
});

describe("export", () => {
  it("writes a plural with an offset and only `other` the same again", () => {
    // the plural on `m` selects nothing and is written as its `#`, which the
    // import reads back as that `#`
    const exported = expectSameDisplay(
      "{n, plural, other {}}{m, plural, offset:1 other {b#}}",
      combinations({ n: counts, m: counts }),
    );
    expect(exported).toBe(
      "{n, plural, other {b{m, plural, offset:1 other {#}}}}",
    );
  });

  it("moves a select with a literal # out of a plural", () => {
    // in `h=other`, the select on `g` with "#" would be nested in the plural
    // on `m`, where ICU reads neither `#` nor `'#'` as "#"
    const exported = expectSameDisplay(
      "{h, select, b {{m, plural, =1 {{g, select, other {}}} other {}}} other {{g, select, b {{m, plural, one {} other {#}}} other {{g, select, a {#} other {}}}}}}",
      combinations({ h: ["a", "b"], g: ["a", "b", "c"], m: counts }),
    );
    expect(exported).toBe(
      "{h, select, b {{g, select, other {{m, plural, =1 {} other {}}}}} other {{g, select, b {{m, plural, one {} other {#}}} a {#} other {}}}}",
    );
  });

  it("writes a repeated plural the same again", () => {
    // The last plural on `n` follows one in `g=a` only, and gets the next
    // selector of `n` there only. The export nests it in `other` of `g`
    // without that other plural.
    const exported = expectSameDisplay(
      "{g, select, a {{n, plural, one {A} other {B}}} other {}}{h, select, b {x} other {}}{n, plural, one {#} other {# n}}",
      combinations({ g: ["a", "b"], h: ["a", "b"], n: counts }),
    );
    expect(exported).toBe(
      "{g, select, a {{n, plural, one {A{h, select, b {x{n, plural, one {#} other {# n}}} other {{n, plural, one {#} other {# n}}}}} other {B{h, select, b {x{n, plural, one {#} other {# n}}} other {{n, plural, one {#} other {# n}}}}}}} other {{n, plural, one {{h, select, b {x} other {}}#} other {{h, select, b {x} other {}}# n}}}}",
    );
  });
});

describe("selectors ahead from different branches", () => {
  // `a0` to `a{m-1}` each enclose a plural whose `other` selects on each of
  // them in another case of a select on `c`
  const message = (m: number, k: number) => {
    const keys = Array.from({ length: k }, (_, index) => `k${index}`);
    const args = Array.from({ length: m }, (_, index) => `a${index}`);
    let result = `{n, plural, one {ONE} other {{c, select, ${args
      .map(
        (arg, index) =>
          `p${index} {{${arg}, select, ${keys
            .map((key) => `${key} {${arg}${key}}`)
            .join(" ")} other {${arg}O}}}`,
      )
      .join(" ")} other {CO}}}}`;
    for (const arg of [...args].reverse()) {
      result = `{${arg}, select, x {X} other {${result}}}`;
    }
    return result;
  };

  it("selects what ICU selects", () => {
    expectSameSelection(
      message(3, 3),
      combinations({
        n: [1, 2],
        c: ["p0", "p1", "p2", "q"],
        a0: ["x", "k0", "k1", "k2", "z"],
        a1: ["x", "k0", "k1", "k2", "z"],
        a2: ["x", "k0", "k1", "k2", "z"],
      }),
    );
  });

  it("copies a variant for the keys of each selector, not for their combinations", () => {
    // combinations would be 6^5 copies of `ONE`
    const parsed = parseMessage({
      messageSource: message(5, 5),
      bundleId: "bundle",
      locale,
    });
    expect(parsed.variants.length).toBeLessThan(200);
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
    /** Plurals on an argument more than once. */
    repeatedPlurals: boolean;
    /** Literal "#", outside of plurals and quoted in them. */
    literalHash: boolean;
    /** Plurals with an offset and only `other`, besides some by chance. */
    singleCaseOffsets?: boolean;
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
        const hash = options.literalHash
          ? { outside: "#", plural: "'#'", "select in plural": "c" }[place]
          : "c";
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
        if (!options.repeatedPlurals) plurals.add(arg);
        const offset = arg === "m" && random() < 0.5 ? " offset:1" : "";
        const keys = ["=0", "=1", "=5", "one"].filter(() => random() < 0.4);
        // a plural with an offset and only `other` is how `#` with an offset
        // outside of its plural exports
        if (offset && keys.length === 0 && !options.singleCaseOffsets) {
          keys.push("one");
        }
        if (options.singleCaseOffsets && offset && random() < 0.3) {
          keys.length = 0;
        }
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
    const generate = messageGenerator(4479, {
      repeatedPlurals: true,
      literalHash: true,
    });
    for (let i = 0; i < 300; i++) {
      expectSameSelection(generate(), fuzzValues);
    }
  });

  it("exports what it imports, the same again", { timeout: 120_000 }, () => {
    const generate = messageGenerator(4480, {
      repeatedPlurals: false,
      literalHash: false,
    });
    for (let i = 0; i < 300; i++) {
      expectSameDisplay(generate(), fuzzValues);
    }
  });

  it(
    "exports plurals with an offset and only `other` the same again",
    { timeout: 120_000 },
    () => {
      const generate = messageGenerator(4481, {
        repeatedPlurals: false,
        literalHash: false,
        singleCaseOffsets: true,
      });
      for (let i = 0; i < 300; i++) {
        expectSameDisplay(generate(), fuzzValues);
      }
    },
  );

  it(
    "exports repeated plurals and literal # as valid ICU that displays the same",
    { timeout: 120_000 },
    () => {
      // A second export can still differ from the first for some of these,
      // e.g. plurals on an argument with only `other` nested in each other
      // differently in different cases, or texts that the import merges.
      const generate = messageGenerator(4483, {
        repeatedPlurals: true,
        literalHash: true,
        singleCaseOffsets: true,
      });
      for (let i = 0; i < 300; i++) {
        expectSameDisplay(generate(), fuzzValues, { sameAgain: false });
      }
    },
  );
});
