import type {
  Bundle,
  Declaration,
  Expression,
  FunctionReference,
  Message,
  Pattern,
  Variant,
  VariableReference,
} from "@inlang/sdk";
import { escapeIcuText } from "./escape.js";

const POUND_FUNCTION = "icu:pound";

/**
 * The plural or selectordinal that encloses a pattern, which `#` refers to.
 * A select passes the enclosing plural through to its cases.
 */
type PluralContext = {
  arg: string;
  offset: number;
  /**
   * The pattern sits in a select nested in the plural. ICU and
   * intl-messageformat read `#` there as a literal "#" and `'#'` as an
   * apostrophe, "#" and the start of a quote, while the import reads `#`
   * there as the number and `'#'` as "#". No quoting reads the same in both.
   * So `#` is only written directly in its plural, and a literal "#" there
   * throws `HashInSelect`.
   */
  inSelect: boolean;
  /** The selects the pattern is nested in inside the plural, outermost first. */
  selects?: string[];
  /** The selectors of the plural, its exact selector first if it has one. */
  selectors?: string[];
};

/** The context of the cases of a select, in the context `plural`. */
function selectContext(
  plural: PluralContext | undefined,
  selector: VariableReference,
): PluralContext | undefined {
  return (
    plural && {
      ...plural,
      inSelect: true,
      selects: [...(plural.selects ?? []), selector.name],
    }
  );
}

/**
 * Thrown for a literal "#" in a select nested in a plural, which ICU and the
 * import read differently. See `serializeMessage`.
 */
class HashInSelect extends Error {
  constructor(
    /** The selects the "#" is nested in inside the plural, outermost first. */
    readonly selects: string[],
    /** The selectors of the plural. */
    readonly plural: string[],
  ) {
    super('A literal "#" in a select nested in a plural');
  }
}

export function serializeMessage(args: {
  bundle: Bundle;
  message: Message;
  variants: Variant[];
}): string {
  const { bundle, message, variants } = args;
  const env: Env = {
    pluralOffsets: collectPluralOffsets(bundle.declarations, message),
    locale: message.locale,
    selectors: message.selectors.map((selector) => selector.name),
    indexOf: new Map(
      message.selectors.map((selector, index) => [selector.name, index]),
    ),
  };
  if (message.selectors.length === 0) {
    if (variants.length === 0) return "";
    return serializePattern(variants[0]!.pattern, {
      plural: undefined,
      env,
    });
  }

  // A literal "#" in a select nested in a plural can't be written so that
  // ICU and the import read the same (see `PluralContext.inSelect`). The
  // select then moves out of the plural: ahead of it in the order the cases
  // are nested in, for all cases alike, which keeps the export of the export
  // the same. MessageFormat 2 still selects by the selectors of the message
  // (see `Env.selectors`).
  const positioned = variants.map(
    (variant, position): CaseVariant => ({ ...variant, position }),
  );
  let order = message.selectors;
  for (;;) {
    try {
      return serializeVariants(
        positioned,
        order,
        bundle.declarations,
        undefined,
        env,
      );
    } catch (error) {
      if (!(error instanceof HashInSelect)) throw error;
      const select = order.find(
        (selector) => selector.name === error.selects[0],
      );
      const pluralIndex = order.findIndex((selector) =>
        error.plural.includes(selector.name),
      );
      if (
        !select ||
        pluralIndex === -1 ||
        order.indexOf(select) < pluralIndex
      ) {
        throw error;
      }
      const rest = order.filter((selector) => selector !== select);
      order = [
        ...rest.slice(0, pluralIndex),
        select,
        ...rest.slice(pluralIndex),
      ];
    }
  }
}

/** What serializing the variants of a message needs to know of it. */
type Env = {
  /** See `collectPluralOffsets`. */
  pluralOffsets: Map<string, Set<number>>;
  /** The locale of the message, for the plural category of exact values. */
  locale: string;
  /**
   * The selectors of the message in order, by which MessageFormat 2 selects
   * variants, whatever order the cases are written in.
   */
  selectors: string[];
  /** The index of each selector in `selectors`. */
  indexOf: Map<string, number>;
};

/**
 * The offsets of the plurals on each argument, to resolve the offset of a
 * `#` imported before the offset was kept on `#`. Only the plurals the
 * message selects on count: the bundle's declarations are shared by all
 * locales, and another locale may use the same argument without an offset.
 * For an argument the message has no plural on, e.g. after an editor removed
 * the plural around a `#`, all plurals of the bundle on it count.
 */
function collectPluralOffsets(
  declarations: Declaration[],
  message: Message,
): Map<string, Set<number>> {
  const selected = new Set(message.selectors.map((selector) => selector.name));
  const all = new Map<string, Set<number>>();
  const ofMessage = new Map<string, Set<number>>();
  for (const declaration of declarations) {
    if (
      declaration.type !== "local-variable" ||
      declaration.value.arg.type !== "variable-reference" ||
      declaration.value.annotation?.type !== "function-reference" ||
      declaration.value.annotation.name !== "plural"
    ) {
      continue;
    }
    const arg = declaration.value.arg.name;
    const offset = parseOffset(
      optionValue(declaration.value.annotation, "offset"),
    );
    for (const offsets of selected.has(declaration.name)
      ? [all, ofMessage]
      : [all]) {
      if (!offsets.has(arg)) offsets.set(arg, new Set());
      offsets.get(arg)!.add(offset);
    }
  }
  for (const [arg, offsets] of all) {
    if (!ofMessage.has(arg)) ofMessage.set(arg, offsets);
  }
  return ofMessage;
}

function serializeVariants(
  variants: Variant[],
  selectors: VariableReference[],
  declarations: Declaration[],
  plural: PluralContext | undefined,
  env: Env,
): string {
  if (variants.length === 0) return "";
  if (selectors.length === 0) {
    return serializePattern(selectedVariant(variants, env).pattern, {
      plural,
      env,
    });
  }

  const nextSelectorIndex = selectors.findIndex((candidate) =>
    variants.some((variant) =>
      variant.matches.some((match) => match.key === candidate.name),
    ),
  );
  if (nextSelectorIndex === -1) {
    return serializePattern(selectedVariant(variants, env).pattern, {
      plural,
      env,
    });
  }

  const selector = selectors[nextSelectorIndex]!;
  const pluralSelectorPair = resolvePluralSelectorPair(
    selectors,
    nextSelectorIndex,
    declarations,
  );
  if (pluralSelectorPair) {
    return serializePluralSelectorPair(
      variants,
      selectors.slice(nextSelectorIndex + 2),
      declarations,
      plural,
      env,
      pluralSelectorPair,
    );
  }

  const restSelectors = selectors.slice(nextSelectorIndex + 1);
  const selectorConfig = resolveSelectorConfig(selector, declarations);
  const isPluralContext = selectorConfig.type !== "select";

  const patterns = variants.map((variant) => variant.pattern);
  const minPatternLength = Math.min(
    ...patterns.map((pattern) => pattern.length),
  );

  const caseContext: PluralContext | undefined = isPluralContext
    ? {
        arg: selectorConfig.arg,
        offset: selectorConfig.offset ?? 0,
        inSelect: false,
      }
    : selectContext(plural, selector);
  const below = pluralContextsBelow(
    variants,
    [selector, ...restSelectors],
    declarations,
  );
  // a `#` stays in the plural it is a `#` of
  const keepsPart = (part: Pattern[number]) =>
    writesPound(part, { plural: caseContext, env }) ||
    keepsPound(part, { below, outside: plural, env });
  const rawPrefix = commonPrefix(
    variants.map((variant) => variant.pattern),
    keepsPart,
  );
  // a shared `#` that is a `#` only around the selector, or a literal "#" in
  // a select in a plural (see `PluralContext.inSelect`), moves out even if
  // that leaves a case empty
  const hoistHash = patterns.some((pattern) =>
    pattern.some(
      (part) =>
        (isHashText(part) && !isPluralContext && plural !== undefined) ||
        (writesPound(part, { plural, env }) &&
          !writesPound(part, { plural: caseContext, env })),
    ),
  );
  const prefixLength =
    rawPrefix.length >= minPatternLength && !hoistHash ? 0 : rawPrefix.length;
  const patternsWithoutPrefix = patterns.map((pattern) =>
    pattern.slice(prefixLength),
  );
  const rawSuffix = commonSuffix(patternsWithoutPrefix, keepsPart);
  const suffixLength =
    rawSuffix.length >= minPatternLength - prefixLength && !hoistHash
      ? 0
      : rawSuffix.length;
  const prefix = prefixLength === 0 ? [] : rawPrefix;
  const suffix = suffixLength === 0 ? [] : rawSuffix;
  const strippedVariants = variants.map((variant) => ({
    ...variant,
    pattern: stripPattern(variant.pattern, prefixLength, suffixLength),
  }));

  const byKey = new Map<string, Variant[]>();
  const unmatched: Variant[] = [];
  for (const variant of strippedVariants) {
    const match = variant.matches.find(
      (entry: Variant["matches"][number]) => entry.key === selector.name,
    );
    if (!match) {
      unmatched.push(variant);
      continue;
    }
    const key = matchKey(match);
    const current = byKey.get(key) ?? [];
    current.push(removeMatchForSelector(variant, selector.name));
    byKey.set(key, current);
  }
  // a case of a select or plural displays a variant of its key or, if none
  // of those matches, of `other`
  const others = [...(byKey.get("*") ?? []), ...unmatched];
  const groups = new Map<string, Variant[]>();
  // the cases of a plural without exact values in the order of the
  // message's variants, which the import sorts like ICU (categories, then
  // `other`) and an editor keeps as it wrote them. Variants of `other` added
  // to a case don't count. A plural with exact values orders its cases in
  // `serializePluralSelectorPair`.
  const keys = isPluralContext
    ? [...byKey.keys()].sort(
        (left, right) =>
          firstPosition(byKey.get(left)!) - firstPosition(byKey.get(right)!),
      )
    : [...byKey.keys()];
  for (const key of keys) {
    groups.set(
      key,
      key === "*"
        ? caseVariants([[others, { [selector.name]: 1 }]], env)
        : caseVariants(
            [
              [byKey.get(key)!, { [selector.name]: 0 }],
              [others, { [selector.name]: 1 }],
            ],
            env,
          ),
    );
  }
  if (!groups.has("*")) {
    groups.set("*", caseVariants([[others, { [selector.name]: 1 }]], env));
  }

  const pluralCases = isPluralContext
    ? serializePluralCases({
        groups,
        selectors: restSelectors,
        declarations,
        config: selectorConfig as PluralConfig,
        env,
        caseKey: caseKeyFromMatch,
        names: [selector.name],
        plural,
      })
    : serializeSelectCases({
        groups,
        selector,
        selectors: restSelectors,
        declarations,
        plural,
        env,
      });
  const { cases, siblings } = pluralCases;

  const select = serializeSelect(selectorConfig, cases, { plural, env });

  if (siblings) {
    return serializeSiblings({
      siblings,
      select,
      prefix,
      suffix,
      selectors: restSelectors,
      declarations,
      plural,
      env,
    });
  }

  return [
    serializePattern(prefix, { plural, env }),
    select,
    serializePattern(suffix, { plural, env }),
  ].join("");
}

/**
 * Writes a select or plural with its cases. A plural with an offset whose
 * only case is `other {#}` is how a `#` with an offset is written outside of
 * its plural (see `serializePound`), which the import reads back as that `#`.
 * So it is written as that `#`, in the context around it.
 */
function serializeSelect(
  config: { type: string; arg: string; offset?: number },
  cases: string[],
  options: PatternOptions,
): string {
  let header = `${config.arg}, ${config.type},`;
  if (config.offset && config.offset !== 0) {
    header += ` offset:${config.offset}`;
  }
  if (
    config.type === "plural" &&
    config.offset &&
    cases.length === 1 &&
    cases[0] === "other {#}"
  ) {
    return serializePound(
      { type: "variable-reference", name: config.arg },
      {
        type: "function-reference",
        name: POUND_FUNCTION,
        options: [
          {
            name: "offset",
            value: { type: "literal", value: String(config.offset) },
          },
        ],
      },
      options,
    );
  }
  return `{${header} ${cases.join(" ")}}`;
}

type PluralConfig = {
  type: "plural" | "selectordinal";
  arg: string;
  offset?: number;
};

type Siblings = { heads: Map<string, Variant[]>; tail: Variant[] };

/**
 * Serializes the cases of a plural, grouped by case key. Returns the cases
 * and, if the variants continue with a sibling of the plural (see
 * `splitSiblings`), the siblings.
 *
 * A literal "#" in a select nested in the plural reads differently in ICU
 * and in the import (see `PluralContext.inSelect`). If the select doesn't
 * depend on the plural, it moves out of the plural after it, e.g. for
 * `{n, plural, one {# item} other {# items}} in {c, select, a {#a} other {#b}}`.
 * Otherwise `HashInSelect` goes up to `serializeMessage`, which nests the
 * plural in the select instead.
 */
function serializePluralCases(args: {
  groups: Map<string, Variant[]>;
  selectors: VariableReference[];
  declarations: Declaration[];
  config: PluralConfig;
  env: Env;
  caseKey: (key: string) => string;
  /** The selectors of the plural, its exact selector first if it has one. */
  names: string[];
  /** The context around the plural. */
  plural: PluralContext | undefined;
}): { cases: string[]; siblings: Siblings | undefined } {
  const { groups, selectors, declarations, config } = args;
  const context: PluralContext = {
    arg: config.arg,
    offset: config.offset ?? 0,
    inSelect: false,
    selectors: args.names,
  };
  const serializeCases = (
    caseGroups: Map<string, Variant[]>,
    caseContext: PluralContext,
  ) =>
    Array.from(caseGroups.entries()).map(
      ([key, groupVariants]) =>
        `${args.caseKey(key)} {${serializeVariants(
          groupVariants,
          selectors,
          declarations,
          caseContext,
          args.env,
        )}}`,
    );

  const siblings = splitSiblings(groups, selectors, declarations, {
    config,
    headContext: context,
    plural: args.plural,
    env: args.env,
  });
  try {
    return {
      cases: serializeCases(siblings?.heads ?? groups, context),
      siblings,
    };
  } catch (error) {
    if (
      !(error instanceof HashInSelect) ||
      error.plural.join() !== args.names.join()
    ) {
      throw error;
    }
    const independent = splitSiblings(groups, selectors, declarations, {
      headContext: context,
      plural: args.plural,
      env: args.env,
    });
    if (!independent) throw error;
    return {
      cases: serializeCases(independent.heads, context),
      siblings: independent,
    };
  }
}

/**
 * Serializes the cases of a select. A literal "#" in them, if the select is
 * in a plural, throws `HashInSelect`, unless what follows the select doesn't
 * depend on it: then it is serialized after the select, outside of it (see
 * `splitSiblings`).
 */
function serializeSelectCases(args: {
  groups: Map<string, Variant[]>;
  selector: VariableReference;
  selectors: VariableReference[];
  declarations: Declaration[];
  plural: PluralContext | undefined;
  env: Env;
}): { cases: string[]; siblings: Siblings | undefined } {
  const { selectors, declarations, plural } = args;
  const serializeCases = (caseGroups: Map<string, Variant[]>) =>
    Array.from(caseGroups.entries()).map(
      ([key, groupVariants]) =>
        `${caseKeyFromMatch(key)} {${serializeVariants(
          groupVariants,
          selectors,
          declarations,
          selectContext(plural, args.selector),
          args.env,
        )}}`,
    );
  try {
    return { cases: serializeCases(args.groups), siblings: undefined };
  } catch (error) {
    if (!(error instanceof HashInSelect)) throw error;
    const siblings = splitSiblings(args.groups, selectors, declarations, {
      headContext: selectContext(plural, args.selector),
      plural,
      env: args.env,
    });
    if (!siblings) throw error;
    return { cases: serializeCases(siblings.heads), siblings };
  }
}

/**
 * Separate plurals on the same argument, e.g.
 * `{n, plural, one {# file} other {# files}} {n, plural, one {was} other {were}}`,
 * import as separate selectors, whose variants are the product of their
 * cases. Splits such variants back into the cases of the first plural and,
 * following it, the variants of the second, instead of nesting the second
 * plural in each case of the first.
 *
 * With a `config`, only splits off a plural with the same argument, type and
 * offset. Without one, splits off any selector. What all cases end with
 * moves to the rest, up to a `#` that is neither a `#` of the rest's plural
 * nor of `plural`, the context around both.
 *
 * Returns the case groups with only the first plural's part of the pattern
 * and the variants of the rest, or undefined if the variants are not such a
 * product.
 */
function splitSiblings(
  groups: Map<string, Variant[]>,
  restSelectors: VariableReference[],
  declarations: Declaration[],
  options: {
    config?: PluralConfig;
    /** The context of the cases. */
    headContext: PluralContext | undefined;
    /** The context around the cases and the rest. */
    plural: PluralContext | undefined;
    env: Env;
  },
): Siblings | undefined {
  let tail: Variant[] | undefined;
  const heads = new Map<string, Variant[]>();
  for (const [key, groupVariants] of groups) {
    const head = commonPrefix(
      groupVariants.map((variant) => variant.pattern),
      () => false,
    );
    const rest = groupVariants.map((variant) => ({
      ...variant,
      pattern: variant.pattern.slice(head.length),
    }));
    if (tail === undefined) {
      tail = rest;
    } else if (!sameVariants(tail, rest)) {
      return undefined;
    }
    heads.set(key, [{ ...groupVariants[0]!, matches: [], pattern: head }]);
  }
  if (!tail) return undefined;

  const nextIndex = restSelectors.findIndex((candidate) =>
    tail!.some((variant) =>
      variant.matches.some((match) => match.key === candidate.name),
    ),
  );
  if (nextIndex === -1) return undefined;
  const { config } = options;
  const nextPair = resolvePluralSelectorPair(
    restSelectors,
    nextIndex,
    declarations,
  );
  const nextConfig =
    nextPair?.config ??
    resolveSelectorConfig(restSelectors[nextIndex]!, declarations);
  const nextNames = nextPair
    ? [nextPair.exactSelector.name, nextPair.pluralSelector.name]
    : [restSelectors[nextIndex]!.name];
  if (
    config &&
    (nextConfig.type !== config.type ||
      nextConfig.arg !== config.arg ||
      (nextConfig.offset ?? 0) !== (config.offset ?? 0) ||
      // a plural with an offset that selects nothing is written as its `#`s
      // where it can, see `pluralContextsBelow`
      (nextConfig.offset &&
        !tail.some((variant) =>
          variant.matches.some(
            (match) =>
              match.type === "literal-match" && nextNames.includes(match.key),
          ),
        )))
  ) {
    return undefined;
  }

  // what all cases end with goes to the rest
  const restContext: PluralContext | undefined =
    nextConfig.type === "select"
      ? undefined
      : {
          arg: nextConfig.arg,
          offset: nextConfig.offset ?? 0,
          inSelect: false,
        };
  const between = commonSuffix(
    [...heads.values()].map((head) => head[0]!.pattern),
    (part) =>
      writesPound(part, {
        plural: options.headContext,
        env: options.env,
      }) &&
      !writesPound(part, {
        plural: options.plural,
        env: options.env,
      }) &&
      !writesPound(part, {
        plural: restContext,
        env: options.env,
      }),
  );
  for (const head of heads.values()) {
    head[0]!.pattern = head[0]!.pattern.slice(
      0,
      head[0]!.pattern.length - between.length,
    );
  }
  return {
    heads,
    tail: tail.map((variant) => ({
      ...variant,
      pattern: [...between, ...variant.pattern],
    })),
  };
}

/**
 * Serializes sibling plurals, see `splitSiblings`: the first plural and
 * the variants of the rest. Leaves out the first plural if it displays
 * nothing.
 */
function serializeSiblings(args: {
  siblings: Siblings;
  select: string;
  prefix: Pattern;
  suffix: Pattern;
  selectors: VariableReference[];
  declarations: Declaration[];
  plural: PluralContext | undefined;
  env: Env;
}): string {
  const { siblings, prefix, suffix, plural, env } = args;
  const isEmpty = [...siblings.heads.values()].every(
    (head) => head[0]!.pattern.length === 0,
  );
  if (isEmpty) {
    return serializeVariants(
      siblings.tail.map((variant) => ({
        ...variant,
        pattern: [...prefix, ...variant.pattern, ...suffix],
      })),
      args.selectors,
      args.declarations,
      plural,
      env,
    );
  }
  return [
    serializePattern(prefix, { plural, env }),
    args.select,
    serializeVariants(
      siblings.tail.map((variant) => ({
        ...variant,
        pattern: [...variant.pattern, ...suffix],
      })),
      args.selectors,
      args.declarations,
      plural,
      env,
    ),
  ].join("");
}

function sameTakenValues(
  left: Record<string, number>,
  right: Record<string, number>,
): boolean {
  for (const name in left) if (left[name] !== right[name]) return false;
  for (const name in right) if (!(name in left)) return false;
  return true;
}

function sameVariants(left: Variant[], right: Variant[]): boolean {
  return (
    left.length === right.length &&
    left.every(
      (variant, index) =>
        JSON.stringify(variant.matches) ===
          JSON.stringify(right[index]!.matches) &&
        sameTakenValues(takenOf(variant), takenOf(right[index]!)) &&
        rankOf(variant) === rankOf(right[index]!) &&
        variant.pattern.length === right[index]!.pattern.length &&
        variant.pattern.every((part, partIndex) =>
          patternElementsEqual(part, right[index]!.pattern[partIndex]),
        ),
    )
  );
}

/**
 * A variant in a case of a select or plural, with how it matched the
 * selectors that the cases around it took out: 0 for a key, 1 for `other`.
 * Those that come before all others the variants still differ on are only
 * kept as `rank`, the order of the variants by them.
 */
type CaseVariant = Variant & {
  taken?: Record<string, number>;
  rank?: number;
  /** The index of the variant in the message. */
  position?: number;
};

/** The first position of the variants in the message, see `CaseVariant`. */
function firstPosition(variants: Variant[]): number {
  return Math.min(
    ...variants.map(
      (variant) => (variant as CaseVariant).position ?? Number.MAX_SAFE_INTEGER,
    ),
  );
}

function takenOf(variant: Variant): Record<string, number> {
  return (variant as CaseVariant).taken ?? {};
}

function rankOf(variant: Variant): number {
  return (variant as CaseVariant).rank ?? 0;
}

/** How the variant matches the selector: 0 for a key, 1 for `other`. */
function preference(variant: Variant, name: string): number {
  const taken = takenOf(variant)[name];
  if (taken !== undefined) return taken;
  return variant.matches.find((match) => match.key === name)?.type ===
    "literal-match"
    ? 0
    : 1;
}

/**
 * Compares two variants that both match as MessageFormat 2 does: a key
 * before `other`, by the selectors in order. Negative if `left` comes first.
 */
function comparePreference(
  left: Variant,
  right: Variant,
  selectors: string[],
): number {
  const byRank = rankOf(left) - rankOf(right);
  if (byRank !== 0) return byRank;
  for (const name of selectors) {
    const difference = preference(left, name) - preference(right, name);
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * The variant MessageFormat 2 selects among variants that all match: the
 * first of those it prefers.
 */
function selectedVariant(variants: Variant[], env: Env): Variant {
  let selected = variants[0]!;
  for (const variant of variants) {
    if (comparePreference(variant, selected, env.selectors) < 0) {
      selected = variant;
    }
  }
  return selected;
}

/**
 * The variants of a case of a select or plural, from groups of variants with
 * how they matched the selectors the case takes out, e.g. the variants of
 * the case's key and the variants of `other`: a case displays a variant of
 * `other` for values no variant of its key matches. Variants that another
 * one matches whenever they do and is preferred over are left out.
 *
 * How the variants matched the selectors taken out is dropped if the
 * remaining selectors select the same variants without it, which keeps cases
 * that display the same alike, e.g. for sibling plurals.
 */
function caseVariants(
  groups: [Variant[], Record<string, number>][],
  env: Env,
): Variant[] {
  let nonEmpty = 0;
  let takenBefore = false;
  for (const [variants] of groups) {
    if (variants.length > 0) nonEmpty++;
    for (const variant of variants) {
      const { taken, rank } = variant as CaseVariant;
      if (taken || rank !== undefined) takenBefore = true;
    }
  }
  // without matches taken out before, the variants of one group compare by
  // the remaining selectors alone
  if (nonEmpty <= 1 && !takenBefore) {
    return groups.find(([variants]) => variants.length > 0)?.[0] ?? [];
  }
  const names = env.selectors;
  const takenNames = new Set<string>();
  const literalNames = new Set<string>();
  const entries: CaseEntry[] = [];
  for (const [variants, taken] of groups) {
    for (const name in taken) takenNames.add(name);
    for (const variant of variants) {
      const literals = new Map<string, string>();
      for (const match of variant.matches) {
        if (match.type !== "literal-match") continue;
        literals.set(match.key, match.value);
        literalNames.add(match.key);
      }
      const merged = takenBefore ? { ...takenOf(variant), ...taken } : taken;
      if (takenBefore) for (const name in merged) takenNames.add(name);
      entries.push({
        variant,
        taken: merged,
        rank: rankOf(variant),
        literals,
        preferences: [],
        group: "",
      });
    }
  }
  const takenIndexes: number[] = [];
  const remaining: number[] = [];
  for (const [index, name] of names.entries()) {
    (takenNames.has(name) ? takenIndexes : remaining).push(index);
  }
  // taken out before all selectors the variants still differ on, the
  // matches only order the variants
  const firstLiteral = remaining.find((index) =>
    literalNames.has(names[index]!),
  );
  const ranked =
    firstLiteral === undefined ||
    takenIndexes.every((index) => index < firstLiteral);
  if (ranked) {
    const sorted = entries
      .map((entry) => ({
        entry,
        key: [
          entry.rank,
          ...takenIndexes.map((index) => entry.taken[names[index]!] ?? 1),
        ],
      }))
      .sort((left, right) => compareKeys(left.key, right.key));
    let rank = -1;
    let previous: number[] | undefined;
    for (const { entry, key } of sorted) {
      if (!previous || compareKeys(previous, key) !== 0) rank++;
      previous = key;
      entry.rank = rank;
      entry.taken = {};
      entry.group = String(rank);
    }
  } else {
    for (const entry of entries) {
      entry.group = [
        entry.rank,
        ...takenIndexes.map((index) => entry.taken[names[index]!]),
      ].join();
    }
  }
  if (entries.every((entry) => entry.group === entries[0]!.group)) {
    return entries.map(withoutTaken);
  }
  const withPreferences = (entry: CaseEntry) => {
    entry.preferences = names.map(
      (name) => entry.taken[name] ?? (entry.literals.has(name) ? 0 : 1),
    );
  };

  if (!ranked) entries.forEach(withPreferences);
  const dominated = ranked
    ? dominatedByRank(entries, env)
    : dominatedByTaken(entries, names);
  const kept = entries.filter((_, index) => !dominated[index]);
  if (ranked) kept.forEach(withPreferences);
  const all = names.map((_, index) => index);
  // whether the remaining selectors select another of two variants that
  // both match than the selectors taken out do
  let takenMatters = false;
  outer: for (let left = 0; left < kept.length; left++) {
    for (let right = left + 1; right < kept.length; right++) {
      const a = kept[left]!;
      const b = kept[right]!;
      if (a.group === b.group || !overlapsLiterals(a, b)) continue;
      if (comesFirst(a, b, all, true) !== comesFirst(a, b, remaining, false)) {
        takenMatters = true;
        break outer;
      }
    }
  }
  if (!takenMatters) return kept.map(withoutTaken);
  return kept.map((entry) => ({
    ...entry.variant,
    taken: entry.taken,
    rank: entry.rank,
  }));
}

type CaseEntry = {
  variant: Variant;
  taken: Record<string, number>;
  rank: number;
  /** The keys of the variant's literal matches, by selector. */
  literals: Map<string, string>;
  /** Its preference by each selector of the message, see `preference`. */
  preferences: number[];
  /** Equal for the variants that took the same keys out. */
  group: string;
};

function compareKeys(left: number[], right: number[]): number {
  for (let index = 0; index < left.length; index++) {
    const difference = left[index]! - right[index]!;
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * Which variants another one matches whenever they do and comes first then,
 * if all matches taken out are in `rank`: one of a lower rank whose literal
 * matches are some of theirs. Looks those up by their keys instead of
 * comparing all pairs, which large messages make slow.
 */
function dominatedByRank(entries: CaseEntry[], env: Env): boolean[] {
  // the literal matches in selector order
  const sorted = entries.map((entry) =>
    [...entry.literals]
      .map(([name, value]): [number, string] => [
        env.indexOf.get(name) ?? -1,
        value,
      ])
      .sort(([left], [right]) => left - right),
  );
  // the lowest rank of the variants with literal matches, by those matches
  // in selector order
  type Node = { rank: number; children: Map<string, Node> };
  const root: Node = { rank: Infinity, children: new Map() };
  for (const [index, entry] of entries.entries()) {
    let node = root;
    for (const literal of sorted[index]!) {
      const key = literalKey(literal);
      let child = node.children.get(key);
      if (!child) {
        child = { rank: Infinity, children: new Map() };
        node.children.set(key, child);
      }
      node = child;
    }
    node.rank = Math.min(node.rank, entry.rank);
  }
  // whether a variant of a lower rank has some of the literal matches
  const search = (
    node: Node,
    rank: number,
    literals: [number, string][],
    from: number,
  ): boolean => {
    if (node.rank < rank) return true;
    for (let index = from; index < literals.length; index++) {
      const child = node.children.get(literalKey(literals[index]!));
      if (child && search(child, rank, literals, index + 1)) return true;
    }
    return false;
  };
  return entries.map((entry, index) =>
    search(root, entry.rank, sorted[index]!, 0),
  );
}

function literalKey([index, value]: [number, string]): string {
  return `${index}:${value}`;
}

/**
 * Which variants another one matches whenever they do and comes first then,
 * by the matches taken out: the first selector they differ on is one taken
 * out, where the other has the key.
 */
function dominatedByTaken(entries: CaseEntry[], names: string[]): boolean[] {
  return entries.map((entry) =>
    entries.some(
      (other) =>
        other.group !== entry.group &&
        [...other.literals].every(
          ([name, value]) => entry.literals.get(name) === value,
        ) &&
        (() => {
          if (other.rank !== entry.rank) return other.rank < entry.rank;
          for (const [index, name] of names.entries()) {
            const difference =
              other.preferences[index]! - entry.preferences[index]!;
            if (difference !== 0) return difference < 0 && name in other.taken;
          }
          return false;
        })(),
    ),
  );
}

function overlapsLiterals(left: CaseEntry, right: CaseEntry): boolean {
  for (const [name, value] of left.literals) {
    const other = right.literals.get(name);
    if (other !== undefined && other !== value) return false;
  }
  return true;
}

/**
 * Whether `left` comes first by the selectors at `indexes`, and by rank
 * before them if `withRank`, or compares equal.
 */
function comesFirst(
  left: CaseEntry,
  right: CaseEntry,
  indexes: number[],
  withRank: boolean,
): boolean {
  if (withRank && left.rank !== right.rank) return left.rank < right.rank;
  for (const index of indexes) {
    const difference = left.preferences[index]! - right.preferences[index]!;
    if (difference !== 0) return difference < 0;
  }
  return true;
}

function withoutTaken(entry: CaseEntry): Variant {
  const variant = entry.variant as CaseVariant;
  if (!variant.taken && variant.rank === undefined) return variant;
  const { taken: _taken, rank: _rank, ...rest } = variant;
  return rest;
}

/** Whether values exist that both variants match. */
function overlapsMatches(left: Variant, right: Variant): boolean {
  return left.matches.every((match) => {
    if (match.type !== "literal-match") return true;
    const other = right.matches.find((entry) => entry.key === match.key);
    return other?.type !== "literal-match" || other.value === match.value;
  });
}

/** Whether `variant` matches whenever `other` matches. */
function coversMatches(variant: Variant, other: Variant): boolean {
  return variant.matches.every((match) => {
    if (match.type === "catchall-match") return true;
    const otherMatch = other.matches.find((entry) => entry.key === match.key);
    return (
      otherMatch?.type === "literal-match" && otherMatch.value === match.value
    );
  });
}

function matchKey(match: Variant["matches"][number] | undefined): string {
  if (!match || match.type === "catchall-match") return "*";
  return match.value;
}

function caseKeyFromMatch(match: string): string {
  if (match === "*" || match === "other") return "other";
  return match;
}

function removeMatchForSelector(
  variant: Variant,
  selectorName: string,
): Variant {
  return {
    ...variant,
    matches: variant.matches.filter(
      (entry: Variant["matches"][number]) => entry.key !== selectorName,
    ),
  };
}

function removeMatchesForSelectors(
  variant: Variant,
  selectorNames: string[],
): Variant {
  const selectorNameSet = new Set(selectorNames);
  return {
    ...variant,
    matches: variant.matches.filter(
      (entry: Variant["matches"][number]) => !selectorNameSet.has(entry.key),
    ),
  };
}

function resolveSelectorConfig(
  selector: VariableReference,
  declarations: Declaration[],
): {
  type: "select" | "plural" | "selectordinal";
  arg: string;
  offset?: number;
} {
  const local = declarations.find(
    (declaration) =>
      declaration.type === "local-variable" &&
      declaration.name === selector.name,
  ) as Declaration | undefined;

  if (
    local &&
    local.type === "local-variable" &&
    local.value.annotation?.type === "function-reference" &&
    local.value.annotation?.name === "plural"
  ) {
    const arg =
      local.value.arg.type === "variable-reference"
        ? local.value.arg.name
        : selector.name;
    const typeOption = optionValue(local.value.annotation, "type");
    const offsetOption = optionValue(local.value.annotation, "offset");
    return {
      type: typeOption === "ordinal" ? "selectordinal" : "plural",
      arg,
      offset: offsetOption ? Number(offsetOption) : undefined,
    };
  }

  return {
    type: "select",
    arg: selector.name,
  };
}

type PluralSelectorPair = {
  exactSelector: VariableReference;
  pluralSelector: VariableReference;
  config: PluralConfig;
};

/**
 * The exact selector and plural selector at `index` of the selectors, which
 * the import puts in this order. Accepts the reverse order unless the exact
 * selector belongs to the plural selector after it, e.g. in
 * `[nPluralOffset1, nPluralExact, nPlural]`.
 */
function resolvePluralSelectorPair(
  selectors: VariableReference[],
  index: number,
  declarations: Declaration[],
): PluralSelectorPair | undefined {
  const firstSelector = selectors[index];
  const secondSelector = selectors[index + 1];
  if (!firstSelector || !secondSelector) return undefined;
  const exactFirst = tryResolvePluralSelectorPair(
    firstSelector,
    secondSelector,
    declarations,
  );
  if (exactFirst) return exactFirst;
  const thirdSelector = selectors[index + 2];
  if (
    thirdSelector &&
    tryResolvePluralSelectorPair(secondSelector, thirdSelector, declarations)
  ) {
    return undefined;
  }
  return tryResolvePluralSelectorPair(
    secondSelector,
    firstSelector,
    declarations,
  );
}

function tryResolvePluralSelectorPair(
  exactSelector: VariableReference,
  pluralSelector: VariableReference,
  declarations: Declaration[],
): PluralSelectorPair | undefined {
  const exactDeclaration = declarations.find(
    (declaration) =>
      declaration.type === "local-variable" &&
      declaration.name === exactSelector.name,
  );
  const pluralConfig = resolveSelectorConfig(pluralSelector, declarations);

  if (pluralConfig.type !== "plural" && pluralConfig.type !== "selectordinal") {
    return undefined;
  }

  if (
    !exactDeclaration ||
    exactDeclaration.type !== "local-variable" ||
    exactDeclaration.value.annotation !== undefined ||
    exactDeclaration.value.arg.type !== "variable-reference" ||
    exactDeclaration.value.arg.name !== pluralConfig.arg
  ) {
    return undefined;
  }

  return {
    exactSelector,
    pluralSelector,
    config: pluralConfig as PluralConfig,
  };
}

function serializePluralSelectorPair(
  variants: Variant[],
  selectors: VariableReference[],
  declarations: Declaration[],
  plural: PluralContext | undefined,
  env: Env,
  pair: PluralSelectorPair,
): string {
  const patterns = variants.map((variant) => variant.pattern);
  const minPatternLength = Math.min(
    ...patterns.map((pattern) => pattern.length),
  );

  const caseContext: PluralContext = {
    arg: pair.config.arg,
    offset: pair.config.offset ?? 0,
    inSelect: false,
  };
  const below = [
    caseContext,
    ...pluralContextsBelow(variants, selectors, declarations),
  ];
  // a `#` stays in the plural it is a `#` of
  const keepsPart = (part: Pattern[number]) =>
    writesPound(part, { plural: caseContext, env }) ||
    keepsPound(part, { below, outside: plural, env });
  const rawPrefix = commonPrefix(
    variants.map((variant) => variant.pattern),
    keepsPart,
  );
  // a shared `#` that is a `#` only around the plural moves out even if that
  // leaves a case empty
  const hoistHash = patterns.some((pattern) =>
    pattern.some(
      (part) =>
        writesPound(part, { plural, env }) &&
        !writesPound(part, { plural: caseContext, env }),
    ),
  );
  const prefixLength =
    rawPrefix.length >= minPatternLength && !hoistHash ? 0 : rawPrefix.length;
  const patternsWithoutPrefix = patterns.map((pattern) =>
    pattern.slice(prefixLength),
  );
  const rawSuffix = commonSuffix(patternsWithoutPrefix, keepsPart);
  const suffixLength =
    rawSuffix.length >= minPatternLength - prefixLength && !hoistHash
      ? 0
      : rawSuffix.length;
  const prefix = prefixLength === 0 ? [] : rawPrefix;
  const suffix = suffixLength === 0 ? [] : rawSuffix;
  const strippedVariants = variants.map((variant) => ({
    ...variant,
    pattern: stripPattern(variant.pattern, prefixLength, suffixLength),
  }));

  // the variants of each exact value and category, and of neither
  const exact = new Map<string, { variant: Variant; category?: string }[]>();
  const categories = new Map<string, Variant[]>();
  const others: Variant[] = [];
  const unmatched: Variant[] = [];
  for (const variant of strippedVariants) {
    const exactMatch = variant.matches.find(
      (entry: Variant["matches"][number]) =>
        entry.key === pair.exactSelector.name,
    );
    const pluralMatch = variant.matches.find(
      (entry: Variant["matches"][number]) =>
        entry.key === pair.pluralSelector.name,
    );
    if (!exactMatch && !pluralMatch) {
      unmatched.push(variant);
      continue;
    }
    const rest = removeMatchesForSelectors(variant, [
      pair.exactSelector.name,
      pair.pluralSelector.name,
    ]);
    if (exactMatch?.type === "literal-match") {
      const current = exact.get(exactMatch.value) ?? [];
      current.push({
        variant: rest,
        category:
          pluralMatch?.type === "literal-match" ? pluralMatch.value : undefined,
      });
      exact.set(exactMatch.value, current);
    } else if (pluralMatch?.type === "literal-match") {
      const current = categories.get(pluralMatch.value) ?? [];
      current.push(rest);
      categories.set(pluralMatch.value, current);
    } else {
      others.push(rest);
    }
  }
  others.push(...unmatched);

  const taken = (exact: number, category: number) => ({
    [pair.exactSelector.name]: exact,
    [pair.pluralSelector.name]: category,
  });
  const categoryOf = pluralCategoryOf(env.locale, pair.config);
  const groups = new Map<string, Variant[]>();
  for (const [value, entries] of exact) {
    const category = categoryOf(value);
    // a variant with the exact value and another category never matches
    const valueVariants = entries.flatMap(
      (entry): [Variant[], Record<string, number>][] =>
        entry.category === undefined
          ? [[[entry.variant], taken(0, 1)]]
          : category === undefined || entry.category === category
            ? [[[entry.variant], taken(0, 0)]]
            : [],
    );
    if (valueVariants.length === 0) continue;
    // for the value, MessageFormat 2 also selects variants of its category
    // and of `other`
    groups.set(
      `=${value}`,
      caseVariants(
        [
          ...valueVariants,
          [
            category === undefined ? [] : (categories.get(category) ?? []),
            taken(1, 0),
          ],
          [others, taken(1, 1)],
        ],
        env,
      ),
    );
  }
  for (const [category, categoryVariants] of categories) {
    groups.set(
      category,
      caseVariants(
        [
          [categoryVariants, taken(1, 0)],
          [others, taken(1, 1)],
        ],
        env,
      ),
    );
  }
  groups.set("other", caseVariants([[others, taken(1, 1)]], env));

  const pluralCases = serializePluralCases({
    groups,
    selectors,
    declarations,
    config: pair.config,
    env,
    caseKey: (key) => key,
    names: [pair.exactSelector.name, pair.pluralSelector.name],
    plural,
  });
  const { cases, siblings } = pluralCases;

  const select = serializeSelect(pair.config, cases, { plural, env });

  if (siblings) {
    return serializeSiblings({
      siblings,
      select,
      prefix,
      suffix,
      selectors,
      declarations,
      plural,
      env,
    });
  }

  return [
    serializePattern(prefix, { plural, env }),
    select,
    serializePattern(suffix, { plural, env }),
  ].join("");
}

/**
 * The plural category of an exact value of the plural, by the rules of the
 * default locale if the locale is not a valid tag, or undefined without
 * plural rules.
 */
function pluralCategoryOf(
  locale: string,
  config: PluralConfig,
): (value: string) => string | undefined {
  const options: Intl.PluralRulesOptions = {
    type: config.type === "selectordinal" ? "ordinal" : "cardinal",
  };
  let rules: Intl.PluralRules | undefined;
  try {
    rules = new Intl.PluralRules(locale, options);
  } catch {
    try {
      rules = new Intl.PluralRules(undefined, options);
    } catch {
      rules = undefined;
    }
  }
  return (value) => rules?.select(Number(value) - (config.offset ?? 0));
}

function optionValue(
  annotation: FunctionReference,
  name: string,
): string | undefined {
  const option = annotation.options.find(
    (entry: FunctionReference["options"][number]) => entry.name === name,
  );
  if (!option || option.value.type !== "literal") return undefined;
  return option.value.value;
}

type PatternOptions = {
  /** The plural or selectordinal the pattern sits in. */
  plural: PluralContext | undefined;
  /** To resolve the offset of a legacy `#`. */
  env: Env;
};

function serializePattern(pattern: Pattern, options: PatternOptions): string {
  return mergeTexts(pattern)
    .map((part: Pattern[number]) => {
      switch (part.type) {
        case "text":
          return escapeText(part.value, options);
        case "expression":
          return serializeExpression(part, options);
        case "markup-start":
        case "markup-end":
        case "markup-standalone":
          throw new Error(
            "Markup placeholders are not supported by ICU MessageFormat 1",
          );
      }
    })
    .join("");
}

function serializeExpression(
  expression: Expression,
  options: PatternOptions,
): string {
  if (
    expression.annotation?.type === "function-reference" &&
    expression.annotation.name === POUND_FUNCTION
  ) {
    return serializePound(expression.arg, expression.annotation, options);
  }

  const arg =
    expression.arg.type === "variable-reference"
      ? expression.arg.name
      : expression.arg.value;

  if (!expression.annotation) {
    return `{${arg}}`;
  }

  const style = optionValue(expression.annotation, "style");
  if (style) {
    return `{${arg}, ${expression.annotation.name}, ${style}}`;
  }
  return `{${arg}, ${expression.annotation.name}}`;
}

/**
 * `#` displays `arg - offset` of the plural it sits in. Write `#` when it
 * sits in a plural on the same argument with the same offset. Elsewhere, for
 * example after an editor removed or changed the plural around it, write what
 * it displays: `{count, number}`, or a one-case plural that applies the
 * offset.
 */
function serializePound(
  arg: Expression["arg"],
  annotation: FunctionReference,
  options: PatternOptions,
): string {
  if (arg.type !== "variable-reference") return "#";
  const offset = poundOffset(arg.name, annotation, options);
  if (
    options.plural &&
    options.plural.arg === arg.name &&
    offset === options.plural.offset
  ) {
    // ICU reads `#` in a select nested in the plural as a literal "#"
    if (!options.plural.inSelect) return "#";
  }
  if (offset === 0) return `{${arg.name}, number}`;
  return `{${arg.name}, plural, offset:${offset} other {#}}`;
}

/**
 * The offset a `#` subtracts from its argument.
 *
 * `#` imports with an `offset` option when its plural has an offset, and
 * without one when it has none. Imports from before the offset was kept on
 * `#` have no option even in a plural with an offset. A `#` without an option
 * is therefore only such a legacy `#` when no plural on its argument (see
 * `collectPluralOffsets`) lacks an offset: then it takes the offset of the
 * enclosing plural on its argument, or, outside of one, the offset of the
 * plural on its argument. Otherwise it has offset 0.
 */
function poundOffset(
  argName: string,
  annotation: FunctionReference,
  options: PatternOptions,
): number {
  const offsetOption = optionValue(annotation, "offset");
  if (offsetOption !== undefined) return parseOffset(offsetOption);

  const offsets = options.env.pluralOffsets.get(argName) ?? new Set();
  if (offsets.size === 0 || offsets.has(0)) return 0;

  // legacy `#`
  if (options.plural?.arg === argName) return options.plural.offset;
  // outside of its plural, the offset is only known if all plurals on the
  // argument share it
  if (offsets.size === 1) return [...offsets][0]!;
  return 0;
}

function parseOffset(value: string | undefined): number {
  if (value === undefined) return 0;
  const offset = Number(value);
  return Number.isFinite(offset) ? offset : 0;
}

/**
 * Joins adjacent text parts, to escape them together: escaped one by one,
 * the texts `#'` and `#` give `'#'''` and `'#'`, which read as one quoted
 * segment.
 */
function mergeTexts(pattern: Pattern): Pattern {
  const merged: Pattern = [];
  for (const part of pattern) {
    const last = merged.at(-1);
    if (part.type === "text" && last?.type === "text") {
      merged[merged.length - 1] = {
        type: "text",
        value: last.value + part.value,
      };
    } else {
      merged.push(part);
    }
  }
  return merged;
}

function escapeText(value: string, options: PatternOptions): string {
  if (options.plural?.inSelect && value.includes("#")) {
    throw new HashInSelect(
      options.plural.selects ?? [],
      options.plural.selectors ?? [],
    );
  }
  return escapeIcuText(value, options.plural !== undefined);
}

export const _private = {
  serializePattern,
  resolveSelectorConfig,
};

function stripPattern(
  pattern: Pattern,
  prefixLength: number,
  suffixLength: number,
): Pattern {
  return pattern.slice(prefixLength, pattern.length - suffixLength);
}

function commonPrefix(
  patterns: Pattern[],
  stopAt: (part: Pattern[number]) => boolean,
): Pattern {
  const prefix: Pattern = [];
  const minLength = Math.min(...patterns.map((pattern) => pattern.length));
  for (let i = 0; i < minLength; i += 1) {
    const base = patterns[0]?.[i];
    if (!base) break;
    if (stopAt(base)) break;
    if (patterns.every((pattern) => patternElementsEqual(pattern[i], base))) {
      prefix.push(base);
    } else {
      break;
    }
  }
  return prefix;
}

function commonSuffix(
  patterns: Pattern[],
  stopAt: (part: Pattern[number]) => boolean,
): Pattern {
  const suffix: Pattern = [];
  const minLength = Math.min(...patterns.map((pattern) => pattern.length));
  for (let i = 0; i < minLength; i += 1) {
    const base = patterns[0]?.[patterns[0]!.length - 1 - i];
    if (!base) break;
    if (stopAt(base)) break;
    if (
      patterns.every((pattern) =>
        patternElementsEqual(pattern[pattern.length - 1 - i], base),
      )
    ) {
      suffix.unshift(base);
    } else {
      break;
    }
  }
  return suffix;
}

function patternElementsEqual(
  left: Pattern[number] | undefined,
  right: Pattern[number] | undefined,
): boolean {
  if (!left || !right || left.type !== right.type) return false;
  if (left.type === "text" && right.type === "text") {
    return left.value === right.value;
  }
  if (left.type === "expression" && right.type === "expression") {
    if (left.arg.type !== right.arg.type) return false;
    if (left.arg.type === "variable-reference") {
      if (
        right.arg.type !== "variable-reference" ||
        left.arg.name !== right.arg.name
      ) {
        return false;
      }
    } else if (
      right.arg.type !== "literal" ||
      left.arg.value !== right.arg.value
    ) {
      return false;
    }

    if (!left.annotation && !right.annotation) return true;
    if (!left.annotation || !right.annotation) return false;
    if (left.annotation.name !== right.annotation.name) return false;
    return (
      JSON.stringify(left.annotation.options) ===
      JSON.stringify(right.annotation.options)
    );
  }
  return false;
}

/**
 * Whether the part is a `#` that stays where it is, instead of moving out
 * into the context `outside`: it is not written as `#` there, but can be in
 * one of the plurals `below`, which the pattern is serialized in.
 */
function keepsPound(
  part: Pattern[number],
  options: {
    below: PluralContext[];
    outside: PluralContext | undefined;
    env: Env;
  },
): boolean {
  const { env } = options;
  return (
    !writesPound(part, { plural: options.outside, env }) &&
    options.below.some((plural) => writesPound(part, { plural, env }))
  );
}

/** The selectors that some variant matches on. */
function usedSelectors(
  variants: Variant[],
  selectors: VariableReference[],
): VariableReference[] {
  return selectors.filter((selector) =>
    variants.some((variant) =>
      variant.matches.some((match) => match.key === selector.name),
    ),
  );
}

/**
 * The contexts of the plurals the variants select on below, whose `#`s stay
 * in them. Not of a plural with an offset that selects nothing, i.e. only has
 * `other`: what its cases share moves out of it up to its `#`, which can
 * leave `{arg, plural, offset:N other {#}}`. The import reads that back as a
 * `#` without the plural, which doesn't stay below, and a second export
 * would differ.
 */
function pluralContextsBelow(
  variants: Variant[],
  selectors: VariableReference[],
  declarations: Declaration[],
): PluralContext[] {
  const used = usedSelectors(variants, selectors);
  const contexts: PluralContext[] = [];
  for (let index = 0; index < used.length; index++) {
    // a plural selector, with its exact selector if it has one
    const pair = resolvePluralSelectorPair(used, index, declarations);
    const unit = pair
      ? [pair.exactSelector.name, pair.pluralSelector.name]
      : [used[index]!.name];
    if (pair) index++;
    const config =
      pair?.config ?? resolveSelectorConfig(used[index]!, declarations);
    if (config.type === "select") continue;
    const selects = variants.some((variant) =>
      variant.matches.some(
        (match) => match.type === "literal-match" && unit.includes(match.key),
      ),
    );
    if (config.offset && !selects) continue;
    contexts.push({
      arg: config.arg,
      offset: config.offset ?? 0,
      inSelect: false,
    });
  }
  return contexts;
}

/** Whether the part is a `#` written as `#` in the context. */
function writesPound(part: Pattern[number], options: PatternOptions): boolean {
  if (
    !isPoundExpression(part) ||
    part.type !== "expression" ||
    part.arg.type !== "variable-reference"
  ) {
    return false;
  }
  const context = options.plural;
  return (
    context !== undefined &&
    !context.inSelect &&
    context.arg === part.arg.name &&
    context.offset ===
      poundOffset(part.arg.name, part.annotation as FunctionReference, options)
  );
}

function isHashText(part: Pattern[number]): boolean {
  return part.type === "text" && part.value.includes("#");
}

function isPoundExpression(part: Pattern[number]): boolean {
  return (
    part.type === "expression" &&
    part.annotation?.type === "function-reference" &&
    part.annotation.name === POUND_FUNCTION
  );
}
