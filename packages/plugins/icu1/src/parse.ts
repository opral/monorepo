import { parse } from "@messageformat/parser";
import type {
  Content,
  FunctionArg,
  Octothorpe,
  PlainArg,
  Select,
} from "@messageformat/parser";
import type {
  Declaration,
  Expression,
  FunctionReference,
  LocalVariable,
  Match,
  Pattern,
  VariableReference,
  VariantImport,
} from "@inlang/sdk";
import { escapeIcuText } from "./escape.js";

export type ParsedMessage = {
  declarations: Declaration[];
  selectors: VariableReference[];
  variants: VariantImport[];
};

type Branch = {
  pattern: Pattern;
  matches: Match[];
  /**
   * For each select argument the branch has a catch-all match on: the keys
   * of the selects that sent the branch to `other`. A later select on the
   * same argument can't reach those keys in this branch.
   */
  selectOtherKeys: Map<string, Set<string>>;
  /**
   * For each plural selector the branch has a catch-all match on: the exact
   * values and the categories of the plural cases it doesn't take. A
   * category case doesn't take the exact values.
   */
  pluralOtherKeys: Map<string, PluralKeys>;
  /**
   * The case the branch took at each select or plural that split it, in
   * order. Two branches took the same cases up to where they split.
   */
  path: PathEntry[];
  /** The selectors of the selects and plurals the branch is nested in. */
  enclosing: string[];
};

type PathEntry = {
  /** Which split: the same for the branches split off one branch. */
  split: number;
  selector: string;
  key: string;
  /** 0 for the most specific cases: exact values, then categories, other. */
  specificity: number;
};

type PluralKeys = { exact: Set<string>; categories: Set<string> };

type Token = Content | PlainArg | FunctionArg | Select | Octothorpe;
type TokenList = Token[];

type PluralSelector = {
  selectorName: string;
  exactSelectorName?: string;
  arg: string;
  type: "plural" | "selectordinal";
  offset?: number;
};

/**
 * The plural or selectordinal a `#` refers to: the innermost enclosing one.
 */
type PluralContext = {
  arg: string;
  offset?: number;
};

type ParseContext = {
  inputVariables: Map<string, Declaration>;
  localVariables: Map<string, LocalVariable>;
  selectors: string[];
  /**
   * The selectors of the plurals with the same argument, type and offset.
   * Usually one, shared by plurals in different branches. A plural nested in
   * or following another one in a branch gets the next one in that branch:
   * sharing a selector would merge their cases. It is the next one in the
   * branch only, e.g. for the last plural in
   * `{g, select, a {{n, plural, ...}} other {}}{n, plural, ...}` the second
   * one for `g = a` and the first one otherwise, as in its export
   * `{g, select, a {{n, plural, ...}{n, plural, ...}} other {{n, plural, ...}}}`.
   */
  pluralSelectors: Map<string, PluralSelector[]>;
  exactPluralSelectorKeys: Set<string>;
  /**
   * For each selector, the selectors nested in it. A nested selector must
   * follow the selectors it is nested in: variants match by the selectors in
   * order, so a nested selector ahead of its enclosing one, which a select
   * or plural nested elsewhere can register first, decides first.
   */
  nested: Map<string, Set<string>>;
  /** The number of splits so far, for `PathEntry.split`. */
  splits: number;
};

const NULL_BRANCH: Branch = {
  pattern: [],
  matches: [],
  selectOtherKeys: new Map(),
  pluralOtherKeys: new Map(),
  path: [],
  enclosing: [],
};

export function parseMessage(args: {
  messageSource: string;
  bundleId: string;
  locale: string;
}): ParsedMessage {
  const tokens = parse(args.messageSource, {
    strict: false,
  }) as TokenList;

  const context: ParseContext = {
    inputVariables: new Map(),
    localVariables: new Map(),
    selectors: [],
    pluralSelectors: new Map(),
    exactPluralSelectorKeys: collectExactPluralSelectorKeys(tokens),
    nested: new Map(),
    splits: 0,
  };

  const expanded = expandTokens(tokens, NULL_BRANCH, context, undefined);
  const order = orderSelectors(context);
  const branches = matchSelectorsAhead(expanded, {
    order,
    pluralSelectors: context.pluralSelectors,
    locale: args.locale,
  });

  const declarations = [
    ...context.inputVariables.values(),
    ...context.localVariables.values(),
  ];

  const selectors: VariableReference[] = order.map((name) => ({
    type: "variable-reference",
    name,
  }));

  const variants: VariantImport[] = branches.map((branch) => ({
    messageBundleId: args.bundleId,
    messageLocale: args.locale,
    matches: branch.matches,
    pattern: branch.pattern,
  }));

  return { declarations, selectors, variants };
}

function expandTokens(
  tokens: TokenList,
  branch: Branch,
  context: ParseContext,
  pluralContext: PluralContext | undefined,
): Branch[] {
  let branches: Branch[] = [cloneBranch(branch)];

  for (const token of tokens) {
    switch (token.type) {
      case "content": {
        for (const current of branches) {
          current.pattern.push({ type: "text", value: token.value });
        }
        break;
      }
      case "argument": {
        ensureInputVariable(context, token.arg);
        for (const current of branches) {
          current.pattern.push({
            type: "expression",
            arg: { type: "variable-reference", name: token.arg },
          });
        }
        break;
      }
      case "function": {
        ensureInputVariable(context, token.arg);
        const annotation = functionAnnotation(token.key, token.param);
        for (const current of branches) {
          current.pattern.push({
            type: "expression",
            arg: { type: "variable-reference", name: token.arg },
            annotation,
          });
        }
        break;
      }
      case "octothorpe": {
        if (!pluralContext) {
          for (const current of branches) {
            current.pattern.push({ type: "text", value: "#" });
          }
          break;
        }

        ensureInputVariable(context, pluralContext.arg);
        for (const current of branches) {
          current.pattern.push(poundExpression(pluralContext));
        }
        break;
      }
      case "select": {
        ensureInputVariable(context, token.arg);
        ensureSelectorOrder(context, token.arg);
        const nextBranches: Branch[] = [];
        for (const current of branches) {
          if (selectsAgain(token, current)) {
            addNested(context, current.enclosing, token.arg);
          }
          const caseBranches = selectCaseBranches(token, current);
          const split = context.splits++;
          for (const { selectCase, branch } of caseBranches) {
            branch.enclosing = [...current.enclosing, token.arg];
            if (caseBranches.length > 1) {
              branch.path.push({
                split,
                selector: token.arg,
                key: selectCase.key,
                specificity: selectCase.key === "other" ? 1 : 0,
              });
            }
            for (const expanded of expandTokens(
              selectCase.tokens,
              branch,
              context,
              pluralContext,
            )) {
              expanded.enclosing = current.enclosing;
              nextBranches.push(expanded);
            }
          }
        }
        branches = nextBranches;
        break;
      }
      case "plural":
      case "selectordinal": {
        ensureInputVariable(context, token.arg);
        if (isOffsetPound(token)) {
          for (const current of branches) {
            current.pattern.push(
              poundExpression({ arg: token.arg, offset: token.pluralOffset }),
            );
          }
          break;
        }
        const type = token.type as "plural" | "selectordinal";
        const pluralSelectorKey = createPluralSelectorKey({
          arg: token.arg,
          type,
          offset: token.pluralOffset,
        });
        const withExactSelector =
          context.exactPluralSelectorKeys.has(pluralSelectorKey);
        // a plural nested in or following another one with the same key in
        // the branch gets the next selector, see `ParseContext.pluralSelectors`
        const pluralSelectors = branches.map((current) => {
          const pluralSelector = ensurePluralSelector(context, {
            arg: token.arg,
            type,
            offset: token.pluralOffset,
            withExactSelector,
            index: (
              context.pluralSelectors.get(pluralSelectorKey) ?? []
            ).filter((selector) =>
              current.matches.some(
                (match) => match.key === selector.selectorName,
              ),
            ).length,
          });
          ensureSelectorOrder(
            context,
            pluralSelector.selectorName,
            pluralSelector.exactSelectorName,
          );
          addNested(context, current.enclosing, pluralSelector.selectorName);
          return pluralSelector;
        });

        const cases = sortSelectCases(token.cases, token.type);
        const otherKeys = pluralKeysOf(cases);
        const splits = branches.map(() => context.splits++);
        const nextBranches: Branch[] = [];
        for (const selectCase of cases) {
          for (const [index, current] of branches.entries()) {
            const pluralSelector = pluralSelectors[index]!;
            const matches = matchesForCase(pluralSelector, selectCase.key);
            const newBranch = cloneBranch({
              ...current,
              matches: [...current.matches, ...matches],
              enclosing: [...current.enclosing, pluralSelector.selectorName],
            });
            newBranch.path.push({
              split: splits[index]!,
              selector: pluralSelector.selectorName,
              key: selectCase.key,
              specificity: selectCasePriority(selectCase.key),
            });
            if (!isExactPluralCaseKey(selectCase.key)) {
              newBranch.pluralOtherKeys.set(pluralSelector.selectorName, {
                exact: new Set(otherKeys.exact),
                categories:
                  selectCase.key === "other"
                    ? new Set(otherKeys.categories)
                    : new Set(),
              });
            }
            for (const expanded of expandTokens(
              selectCase.tokens,
              newBranch,
              context,
              { arg: token.arg, offset: token.pluralOffset },
            )) {
              expanded.enclosing = current.enclosing;
              nextBranches.push(expanded);
            }
          }
        }
        branches = nextBranches;
        break;
      }
      default: {
        const exhaustive: never = token;
        throw new Error(`Unsupported token type ${(exhaustive as any)?.type}`);
      }
    }
  }

  return branches;
}

/**
 * `#` displays `arg - offset`. Keep the offset on the expression, so
 * consumers can format `#` without finding the enclosing plural.
 */
function poundExpression(pluralContext: PluralContext): Pattern[number] {
  return {
    type: "expression",
    arg: { type: "variable-reference", name: pluralContext.arg },
    annotation: {
      type: "function-reference",
      name: "icu:pound",
      options:
        pluralContext.offset && pluralContext.offset !== 0
          ? [
              {
                name: "offset",
                value: { type: "literal", value: String(pluralContext.offset) },
              },
            ]
          : [],
    },
  };
}

/**
 * Whether the token is `{arg, plural, offset:N other {#}}`, which the export
 * writes for a `#` with an offset outside of its plural. It imports as that
 * `#`, without a selector, so that a second export writes it the same.
 */
function isOffsetPound(token: Token): boolean {
  return (
    token.type === "plural" &&
    token.pluralOffset !== undefined &&
    token.pluralOffset !== 0 &&
    token.cases.length === 1 &&
    token.cases[0]!.key === "other" &&
    token.cases[0]!.tokens.length === 1 &&
    token.cases[0]!.tokens[0]!.type === "octothorpe"
  );
}

/**
 * The cases of a select a branch reaches, each with the branch that takes it.
 *
 * A select on an argument the branch already selects on, e.g. a select nested
 * in or following another select on the same argument, doesn't select again:
 * the branch takes the case of the value it matched, and a branch on `other`
 * only splits off the keys the earlier selects don't have.
 */
function selectCaseBranches(
  token: Select,
  current: Branch,
): { selectCase: Select["cases"][number]; branch: Branch }[] {
  const literalKeys = token.cases
    .map((selectCase) => selectCase.key)
    .filter((key) => key !== "other");
  const otherCase = token.cases.find(
    (selectCase) => selectCase.key === "other",
  );
  const matchIndex = current.matches.findIndex(
    (match) => match.key === token.arg,
  );
  const existing = current.matches[matchIndex];

  if (!existing) {
    return token.cases.map((selectCase) => {
      const branch = cloneBranch(current);
      if (selectCase.key === "other") {
        branch.matches.push({ type: "catchall-match", key: token.arg });
        branch.selectOtherKeys.set(token.arg, new Set(literalKeys));
      } else {
        branch.matches.push({
          type: "literal-match",
          key: token.arg,
          value: selectCase.key,
        });
      }
      return { selectCase, branch };
    });
  }

  if (existing.type === "literal-match") {
    const selectCase = token.cases.find(
      (entry) => entry.key === existing.value,
    ) ??
      otherCase ?? { ...token.cases[0]!, key: "other", tokens: [] };
    return [{ selectCase, branch: cloneBranch(current) }];
  }

  const otherKeys = current.selectOtherKeys.get(token.arg) ?? new Set();
  const result: { selectCase: Select["cases"][number]; branch: Branch }[] = [];
  for (const selectCase of token.cases) {
    if (selectCase.key === "other") {
      const branch = cloneBranch(current);
      branch.selectOtherKeys.set(
        token.arg,
        new Set([...otherKeys, ...literalKeys]),
      );
      result.push({ selectCase, branch });
    } else if (!otherKeys.has(selectCase.key)) {
      const branch = cloneBranch(current);
      branch.matches[matchIndex] = {
        type: "literal-match",
        key: token.arg,
        value: selectCase.key,
      };
      branch.selectOtherKeys.delete(token.arg);
      result.push({ selectCase, branch });
    }
  }
  return result;
}

function pluralKeysOf(cases: Select["cases"]): PluralKeys {
  const keys: PluralKeys = { exact: new Set(), categories: new Set() };
  for (const selectCase of cases) {
    if (isExactPluralCaseKey(selectCase.key)) {
      keys.exact.add(selectCase.key.slice(1));
    } else if (selectCase.key !== "other") {
      keys.categories.add(selectCase.key);
    }
  }
  return keys;
}

/**
 * Gives branches the matches on selectors ahead of where they split off
 * that branches of less specific cases have.
 *
 * MessageFormat 2 compares variants selector by selector in selector order.
 * A selector that decides after a select or plural, e.g. `g` in
 * `{n, plural, one {X} other {{g, select, a {A} other {O}}}}`, usually
 * follows it. But when the select on `g` also encloses that plural, in
 * another case or around it, it can be ahead of it. Then `g=a, n=*` beats
 * `n=one`, which ICU selects for `n=1, g=a`. The branch of `one` therefore
 * gets a copy for each key ahead that a branch of a less specific case
 * matches on, here `g=a, n=one` next to `g=*, n=one`, which then wins by the
 * plural.
 */
function matchSelectorsAhead(
  branches: Branch[],
  args: {
    order: string[];
    pluralSelectors: ParseContext["pluralSelectors"];
    locale: string;
  },
): Branch[] {
  const lookup = createLookup(args);
  let result = branches;
  // copies can be ahead of other branches in turn
  let fresh = new Set(branches);
  while (fresh.size > 0) {
    const fills = findKeysAhead(result, fresh, lookup);
    const next: Branch[] = [];
    fresh = new Set();
    for (const branch of result) {
      // Copies for the keys of each selector combined would multiply. A copy
      // with a key of a selector wins by it against the branches that give
      // keys of later selectors: those have no literal match on it, else it
      // would decide. So only the copy with the catch-all match gets the keys
      // of later selectors.
      const units = [...(fills.get(branch) ?? [])].sort(
        ([left], [right]) =>
          lookup.positions.get(left)! - lookup.positions.get(right)!,
      );
      const copies = [branch];
      for (const [unit, keys] of units) {
        const plural = lookup.plurals.get(unit);
        const other = copies.pop()!;
        copies.push(
          ...(plural
            ? matchPluralAhead(other, {
                plural,
                keys,
                categoryOf: lookup.categoryOf.get(unit),
              })
            : matchSelectAhead(other, unit, keys.keys)),
        );
      }
      if (copies.length > 1) {
        for (const copy of copies) fresh.add(copy);
      }
      next.push(...copies);
    }
    result = next;
  }
  return result;
}

type Lookup = {
  order: string[];
  /** The position of each selector, of a plural one its exact selector's. */
  positions: Map<string, number>;
  plurals: Map<string, PluralSelector>;
  /** The plural selector of each exact selector. */
  pluralOf: Map<string, string>;
  /** The exact selector of each plural selector that has one. */
  exactOf: Map<string, string>;
  /** The plural category of an exact value, if the locale has rules. */
  categoryOf: Map<string, ((value: string) => string) | undefined>;
  /** The match of a branch on a selector. */
  matchOf: (branch: Branch, name: string) => Match | undefined;
};

function createLookup(args: {
  order: string[];
  pluralSelectors: ParseContext["pluralSelectors"];
  locale: string;
}): Lookup {
  const plurals = new Map<string, PluralSelector>();
  const pluralOf = new Map<string, string>();
  const exactOf = new Map<string, string>();
  const categoryOf = new Map<string, ((value: string) => string) | undefined>();
  for (const shared of args.pluralSelectors.values()) {
    for (const selector of shared) {
      if (!selector) continue;
      plurals.set(selector.selectorName, selector);
      categoryOf.set(
        selector.selectorName,
        pluralCategories(selector, args.locale),
      );
      if (selector.exactSelectorName) {
        pluralOf.set(selector.exactSelectorName, selector.selectorName);
        exactOf.set(selector.selectorName, selector.exactSelectorName);
      }
    }
  }
  const positions = new Map<string, number>();
  for (const [index, name] of args.order.entries()) positions.set(name, index);
  for (const [exact, plural] of pluralOf) {
    positions.set(plural, positions.get(exact)!);
  }
  const matchesOf = new WeakMap<Branch, Map<string, Match>>();
  const matchOf = (branch: Branch, name: string) => {
    let matches = matchesOf.get(branch);
    if (!matches) {
      matches = new Map(branch.matches.map((match) => [match.key, match]));
      matchesOf.set(branch, matches);
    }
    return matches.get(name);
  };
  return {
    order: args.order,
    positions,
    plurals,
    pluralOf,
    exactOf,
    categoryOf,
    matchOf,
  };
}

/**
 * The keys of a select argument, or the categories and exact values of a
 * plural selector.
 */
type KeysAhead = { keys: Set<string>; exact: Set<string> };

/**
 * For each branch, the keys of the selectors ahead that branches of less
 * specific cases, which MessageFormat 2 can select for values ICU selects
 * the branch for, match on, by select argument or plural selector. Only
 * pairs with a branch of `fresh` are compared: the others were before.
 */
function findKeysAhead(
  branches: Branch[],
  fresh: Set<Branch>,
  lookup: Lookup,
): Map<Branch, Map<string, KeysAhead>> {
  const isLiteral = (branch: Branch, name: string) =>
    lookup.matchOf(branch, name)?.type === "literal-match";
  const bySplit = new Map<number, { branch: Branch; entry: PathEntry }[]>();
  for (const branch of branches) {
    for (const entry of branch.path) {
      const entries = bySplit.get(entry.split) ?? [];
      entries.push({ branch, entry });
      bySplit.set(entry.split, entries);
    }
  }
  const result = new Map<Branch, Map<string, KeysAhead>>();
  for (const entries of bySplit.values()) {
    if (!entries.some(({ branch }) => fresh.has(branch))) continue;
    const position = lookup.positions.get(entries[0]!.entry.selector)!;
    // the selectors ahead that some of the branches have a literal match on
    // and others don't; on the others they all match alike
    const mixed = lookup.order.slice(0, position).filter((name) => {
      const literals = entries.filter(({ branch }) =>
        isLiteral(branch, name),
      ).length;
      return literals > 0 && literals < entries.length;
    });
    if (mixed.length === 0) continue;
    // the branches with literal matches on them, grouped by those matches and
    // the specificity of their case, of all branches and of fresh ones
    type Group = {
      specificity: number;
      values: (string | undefined)[];
      branches: Branch[];
    };
    const groups = {
      all: new Map<string, Group>(),
      fresh: new Map<string, Group>(),
    };
    for (const { branch, entry } of entries) {
      if (!mixed.some((name) => isLiteral(branch, name))) continue;
      const values = mixed.map((name) => {
        const match = lookup.matchOf(branch, name);
        return match?.type === "literal-match" ? match.value : undefined;
      });
      const key = JSON.stringify([entry.specificity, values]);
      for (const kind of fresh.has(branch)
        ? (["all", "fresh"] as const)
        : (["all"] as const)) {
        const group = groups[kind].get(key) ?? {
          specificity: entry.specificity,
          values,
          branches: [],
        };
        group.branches.push(branch);
        groups[kind].set(key, group);
      }
    }
    // the keys that decide for the branches of less specific cases, for a
    // branch with literal matches on some of the selectors. Both are only
    // selected for the same values if their literal matches before the
    // deciding selector are the same, by which the groups of each key are
    // kept.
    type Decider = {
      name: string;
      value: string;
      /** The index of the selector in `mixed`. */
      index: number;
      groups: Map<string, Group[]>;
    };
    const cache = new Map<string, Decider[]>();
    const decidersFor = (
      kind: "all" | "fresh",
      specificity: number,
      literals: boolean[],
    ) => {
      const key = JSON.stringify([kind, specificity, literals]);
      const cached = cache.get(key);
      if (cached) return cached;
      const byKey = new Map<string, Decider>();
      for (const group of groups[kind].values()) {
        if (group.specificity <= specificity) continue;
        // the first selector only one of the branches has a literal match on
        // decides between them; at the latest the split one, by which the
        // more specific branch wins
        for (const [index, name] of mixed.entries()) {
          const value = group.values[index];
          if (literals[index] && value === undefined) break;
          if (literals[index] || value === undefined) continue;
          const decider = byKey.get(`${name}=${value}`) ?? {
            name,
            value,
            index,
            groups: new Map(),
          };
          byKey.set(`${name}=${value}`, decider);
          const before = JSON.stringify(group.values.slice(0, index));
          const same = decider.groups.get(before) ?? [];
          same.push(group);
          decider.groups.set(before, same);
          break;
        }
      }
      const deciders = [...byKey.values()];
      cache.set(key, deciders);
      return deciders;
    };
    for (const { branch, entry } of entries) {
      const values = mixed.map((name) => {
        const match = lookup.matchOf(branch, name);
        return match?.type === "literal-match" ? match.value : undefined;
      });
      const literals = values.map((value) => value !== undefined);
      if (literals.every(Boolean)) continue;
      const kind = fresh.has(branch) ? "all" : "fresh";
      for (const decider of decidersFor(kind, entry.specificity, literals)) {
        const unit = lookup.pluralOf.get(decider.name) ?? decider.name;
        const keys = result.get(branch)?.get(unit);
        const added = decider.name === unit ? keys?.keys : keys?.exact;
        if (
          added?.has(decider.value) ||
          excludes(branch, decider, lookup) ||
          !(
            decider.groups.get(
              JSON.stringify(values.slice(0, decider.index)),
            ) ?? []
          ).some((group) =>
            group.branches.some((other) => overlaps(other, branch, lookup)),
          )
        ) {
          continue;
        }
        const fill = result.get(branch) ?? new Map<string, KeysAhead>();
        result.set(branch, fill);
        const unitKeys = fill.get(unit) ?? {
          keys: new Set(),
          exact: new Set(),
        };
        fill.set(unit, unitKeys);
        (decider.name === unit ? unitKeys.keys : unitKeys.exact).add(
          decider.value,
        );
      }
    }
  }
  return result;
}

/**
 * Whether values exist that ICU selects `selected` for and for which
 * MessageFormat 2 can select `other` too: values its literal matches match,
 * as far as the matches of `selected`, the keys its catch-all matches
 * exclude and the plural categories of exact values tell.
 */
function overlaps(other: Branch, selected: Branch, lookup: Lookup): boolean {
  for (const match of other.matches) {
    if (
      match.type === "literal-match" &&
      excludes(selected, { name: match.key, value: match.value }, lookup)
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Whether ICU never selects the branch for a value of a selector: its match
 * is another literal, its catch-all excludes the value, or the value is an
 * exact value with another plural category than the branch's.
 */
function excludes(
  branch: Branch,
  key: { name: string; value: string },
  lookup: Lookup,
): boolean {
  const matchOf = (name: string | undefined) =>
    name === undefined ? undefined : lookup.matchOf(branch, name);
  const match = matchOf(key.name);
  if (match?.type === "literal-match") return match.value !== key.value;
  const exactPlural = lookup.pluralOf.get(key.name);
  if (exactPlural !== undefined) {
    const keys = branch.pluralOtherKeys.get(exactPlural);
    if (keys?.exact.has(key.value)) return true;
    const category = lookup.categoryOf.get(exactPlural)?.(key.value);
    if (category === undefined) return false;
    const pluralMatch = matchOf(exactPlural);
    return pluralMatch?.type === "literal-match"
      ? pluralMatch.value !== category
      : (keys?.categories.has(category) ?? false);
  }
  if (
    branch.selectOtherKeys.get(key.name)?.has(key.value) ||
    branch.pluralOtherKeys.get(key.name)?.categories.has(key.value)
  ) {
    return true;
  }
  // a category, which an exact value of the branch may not have
  const exact = matchOf(lookup.exactOf.get(key.name));
  if (exact?.type !== "literal-match") return false;
  const category = lookup.categoryOf.get(key.name)?.(exact.value);
  return category !== undefined && category !== key.value;
}

/**
 * Copies of the branch with the keys of a select argument ahead that it
 * has no match on yet, or a catch-all match on that doesn't exclude them.
 * The catch-all match then excludes them.
 */
function matchSelectAhead(
  branch: Branch,
  arg: string,
  keys: Set<string>,
): Branch[] {
  const index = branch.matches.findIndex((match) => match.key === arg);
  if (branch.matches[index]?.type === "literal-match") return [branch];
  const excluded = branch.selectOtherKeys.get(arg) ?? new Set<string>();
  const added = [...keys].filter((key) => !excluded.has(key));
  if (added.length === 0) return [branch];
  const withMatch = (match: Match) => {
    const copy = cloneBranch(branch);
    if (index === -1) copy.matches.push(match);
    else copy.matches[index] = match;
    return copy;
  };
  const copies = added.map((value) => {
    const copy = withMatch({ type: "literal-match", key: arg, value });
    copy.selectOtherKeys.delete(arg);
    return copy;
  });
  const other = withMatch({ type: "catchall-match", key: arg });
  other.selectOtherKeys.set(arg, new Set([...excluded, ...added]));
  return [...copies, other];
}

/**
 * Copies of the branch with the exact values and categories of a plural
 * selector ahead that its catch-all matches don't exclude. A copy for an
 * exact value is only made if the branch takes the value: if its category
 * is the branch's category, or one its catch-all doesn't exclude. Without
 * plural rules for the locale, the copy keeps the category match instead,
 * so that only the copy with the value's category wins.
 */
function matchPluralAhead(
  branch: Branch,
  args: {
    plural: PluralSelector;
    keys: KeysAhead;
    categoryOf: ((value: string) => string) | undefined;
  },
): Branch[] {
  const { selectorName, exactSelectorName } = args.plural;
  const { categoryOf } = args;
  const exactMatch = branch.matches.find(
    (match) => match.key === exactSelectorName,
  );
  if (exactMatch?.type === "literal-match") return [branch];
  const pluralMatch = branch.matches.find(
    (match) => match.key === selectorName,
  );
  const excluded = branch.pluralOtherKeys.get(selectorName) ?? {
    exact: new Set<string>(),
    categories: new Set<string>(),
  };
  const addedCategories =
    pluralMatch?.type === "literal-match"
      ? []
      : [...args.keys.keys].filter(
          (category) => !excluded.categories.has(category),
        );
  const addedExact = [...args.keys.exact].filter(
    (value) => !excluded.exact.has(value),
  );
  if (addedCategories.length === 0 && addedExact.length === 0) {
    return [branch];
  }
  const withMatches = (exact: Match | undefined, plural: Match) => {
    const copy = cloneBranch(branch);
    copy.matches = copy.matches.filter(
      (match) => match.key !== exactSelectorName && match.key !== selectorName,
    );
    if (exact) copy.matches.push(exact);
    copy.matches.push(plural);
    return copy;
  };
  const exactCatchall: Match | undefined = exactSelectorName
    ? { type: "catchall-match", key: exactSelectorName }
    : undefined;
  const pluralCatchall: Match = { type: "catchall-match", key: selectorName };
  const pluralMatches: Match[] = [
    ...addedCategories.map(
      (value): Match => ({ type: "literal-match", key: selectorName, value }),
    ),
    pluralMatch ?? pluralCatchall,
  ];
  const result: Branch[] = [];
  // exact values first, like the cases of a plural
  for (const value of addedExact) {
    const exact: Match = {
      type: "literal-match",
      key: exactSelectorName!,
      value,
    };
    if (categoryOf) {
      const category = categoryOf(value);
      const takes =
        pluralMatch?.type === "literal-match"
          ? pluralMatch.value === category
          : !excluded.categories.has(category);
      if (takes) result.push(withMatches(exact, pluralCatchall));
    } else {
      for (const plural of pluralMatches) {
        result.push(withMatches(exact, plural));
      }
    }
  }
  // the branch doesn't take any of the exact values
  if (result.length === 0 && addedCategories.length === 0) return [branch];
  for (const copy of result) copy.pluralOtherKeys.delete(selectorName);
  for (const plural of pluralMatches) {
    const copy = withMatches(exactCatchall, plural);
    copy.pluralOtherKeys.set(selectorName, {
      exact: new Set([...excluded.exact, ...addedExact]),
      categories:
        plural.type === "literal-match"
          ? new Set()
          : new Set([...excluded.categories, ...addedCategories]),
    });
    result.push(copy);
  }
  return result;
}

/**
 * The plural category of an exact value of the plural, or undefined if
 * there are no plural rules for the locale.
 */
function pluralCategories(
  plural: PluralSelector,
  locale: string,
): ((value: string) => string) | undefined {
  let rules: Intl.PluralRules;
  try {
    rules = new Intl.PluralRules(locale, {
      type: plural.type === "selectordinal" ? "ordinal" : "cardinal",
    });
  } catch {
    return undefined;
  }
  return (value) => rules.select(Number(value) - (plural.offset ?? 0));
}

/**
 * Whether the select gives the branch a new match on its argument: the
 * branch has none yet, or matches `other` of an earlier select that lacks
 * keys of this one.
 */
function selectsAgain(token: Select, current: Branch): boolean {
  const existing = current.matches.find((match) => match.key === token.arg);
  if (!existing) return true;
  if (existing.type === "literal-match") return false;
  const otherKeys = current.selectOtherKeys.get(token.arg) ?? new Set();
  return token.cases.some(
    (selectCase) =>
      selectCase.key !== "other" && !otherKeys.has(selectCase.key),
  );
}

function addNested(
  context: ParseContext,
  enclosing: string[],
  selectorName: string,
) {
  for (const outer of enclosing) {
    if (outer === selectorName) continue;
    const nested = context.nested.get(outer) ?? new Set();
    nested.add(selectorName);
    context.nested.set(outer, nested);
  }
}

/**
 * The selectors in the order they first occur, except that a selector
 * follows the selectors it is nested in (see `ParseContext.nested`). An exact
 * selector stays right before its plural selector.
 */
function orderSelectors(context: ParseContext): string[] {
  const exactOf = new Map<string, string>();
  const pluralOf = new Map<string, string>();
  for (const shared of context.pluralSelectors.values()) {
    for (const selector of shared) {
      if (selector?.exactSelectorName) {
        exactOf.set(selector.selectorName, selector.exactSelectorName);
        pluralOf.set(selector.exactSelectorName, selector.selectorName);
      }
    }
  }
  const remaining = [
    ...new Set(context.selectors.map((name) => pluralOf.get(name) ?? name)),
  ];
  const isNestedInRemaining = (name: string) =>
    remaining.some(
      (outer) => outer !== name && context.nested.get(outer)?.has(name),
    );
  const ordered: string[] = [];
  while (remaining.length > 0) {
    // the first selector not nested in another remaining one; the first one
    // if they are nested in each other in different branches
    const index = Math.max(
      0,
      remaining.findIndex((name) => !isNestedInRemaining(name)),
    );
    const [name] = remaining.splice(index, 1);
    const exact = exactOf.get(name!);
    if (exact) ordered.push(exact);
    ordered.push(name!);
  }
  return ordered;
}

function ensureInputVariable(context: ParseContext, name: string) {
  if (!context.inputVariables.has(name)) {
    context.inputVariables.set(name, {
      type: "input-variable",
      name,
    });
  }
}

function ensurePluralSelector(
  context: ParseContext,
  args: {
    arg: string;
    type: "plural" | "selectordinal";
    offset?: number;
    withExactSelector: boolean;
    /** Which of the selectors with this key. */
    index: number;
  },
): PluralSelector {
  const key = createPluralSelectorKey(args);
  const shared = context.pluralSelectors.get(key) ?? [];
  const existing = shared[args.index];
  if (existing) {
    if (args.withExactSelector && !existing.exactSelectorName) {
      existing.exactSelectorName = createExactSelector(context, {
        arg: args.arg,
        selectorName: existing.selectorName,
      });
    }
    return existing;
  }

  const baseName =
    args.type === "selectordinal"
      ? `${args.arg}Ordinal`
      : `${args.arg}Plural${args.offset && args.offset !== 0 ? `Offset${args.offset}` : ""}`;
  let selectorName = baseName;
  let suffix = 1;
  while (
    context.localVariables.has(selectorName) ||
    context.inputVariables.has(selectorName)
  ) {
    selectorName = `${baseName}${suffix}`;
    suffix += 1;
  }

  const options = [] as FunctionReference["options"];
  if (args.type === "selectordinal") {
    options.push({
      name: "type",
      value: { type: "literal", value: "ordinal" },
    });
  }
  if (args.offset && args.offset !== 0) {
    options.push({
      name: "offset",
      value: { type: "literal", value: String(args.offset) },
    });
  }

  const localVariable: LocalVariable = {
    type: "local-variable",
    name: selectorName,
    value: {
      type: "expression",
      arg: { type: "variable-reference", name: args.arg },
      annotation: {
        type: "function-reference",
        name: "plural",
        options,
      },
    },
  };

  context.localVariables.set(selectorName, localVariable);
  const pluralSelector = {
    selectorName,
    arg: args.arg,
    type: args.type,
    offset: args.offset,
    exactSelectorName: args.withExactSelector
      ? createExactSelector(context, {
          arg: args.arg,
          selectorName,
        })
      : undefined,
  } satisfies PluralSelector;
  shared[args.index] = pluralSelector;
  context.pluralSelectors.set(key, shared);

  return pluralSelector;
}

function ensureSelectorOrder(
  context: ParseContext,
  selectorName: string,
  exactSelectorName?: string,
) {
  if (!exactSelectorName) {
    if (!context.selectors.includes(selectorName)) {
      context.selectors.push(selectorName);
    }
    return;
  }

  const exactIndex = context.selectors.indexOf(exactSelectorName);
  const selectorIndex = context.selectors.indexOf(selectorName);

  if (exactIndex === -1 && selectorIndex === -1) {
    context.selectors.push(exactSelectorName, selectorName);
    return;
  }

  if (exactIndex === -1 && selectorIndex !== -1) {
    context.selectors.splice(selectorIndex, 0, exactSelectorName);
    return;
  }

  if (exactIndex !== -1 && selectorIndex === -1) {
    context.selectors.splice(exactIndex + 1, 0, selectorName);
    return;
  }

  if (exactIndex > selectorIndex) {
    context.selectors.splice(exactIndex, 1);
    context.selectors.splice(selectorIndex, 0, exactSelectorName);
  }
}

function createExactSelector(
  context: ParseContext,
  args: { arg: string; selectorName: string },
): string {
  const baseName = `${args.selectorName}Exact`;
  let exactSelectorName = baseName;
  let suffix = 1;
  while (
    context.localVariables.has(exactSelectorName) ||
    context.inputVariables.has(exactSelectorName)
  ) {
    exactSelectorName = `${baseName}${suffix}`;
    suffix += 1;
  }

  context.localVariables.set(exactSelectorName, {
    type: "local-variable",
    name: exactSelectorName,
    value: {
      type: "expression",
      arg: { type: "variable-reference", name: args.arg },
    },
  });

  return exactSelectorName;
}

function matchesForCase(pluralSelector: PluralSelector, key: string): Match[] {
  const { selectorName } = pluralSelector;
  if (pluralSelector.exactSelectorName !== undefined) {
    if (key === "other") {
      return [
        { type: "catchall-match", key: pluralSelector.exactSelectorName },
        { type: "catchall-match", key: selectorName },
      ];
    }

    if (isExactPluralCaseKey(key)) {
      return [
        {
          type: "literal-match",
          key: pluralSelector.exactSelectorName,
          value: key.slice(1),
        },
        { type: "catchall-match", key: selectorName },
      ];
    }

    return [
      { type: "catchall-match", key: pluralSelector.exactSelectorName },
      { type: "literal-match", key: selectorName, value: key },
    ];
  }

  if (key === "other") {
    return [{ type: "catchall-match", key: selectorName }];
  }

  return [{ type: "literal-match", key: selectorName, value: key }];
}

function isExactPluralCaseKey(key: string): boolean {
  return /^=-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(key);
}

function collectExactPluralSelectorKeys(tokens: TokenList): Set<string> {
  const keys = new Set<string>();

  for (const token of tokens) {
    if (token.type === "plural" || token.type === "selectordinal") {
      if (
        token.cases.some((selectCase) => isExactPluralCaseKey(selectCase.key))
      ) {
        keys.add(
          createPluralSelectorKey({
            arg: token.arg,
            type: token.type,
            offset: token.pluralOffset,
          }),
        );
      }
    }

    if (
      token.type === "select" ||
      token.type === "plural" ||
      token.type === "selectordinal"
    ) {
      for (const selectCase of token.cases) {
        for (const key of collectExactPluralSelectorKeys(selectCase.tokens)) {
          keys.add(key);
        }
      }
    }
  }

  return keys;
}

function createPluralSelectorKey(args: {
  arg: string;
  type: "plural" | "selectordinal";
  offset?: number;
}): string {
  return `${args.arg}|${args.type}|${args.offset ?? 0}`;
}

function sortSelectCases(
  cases: Select["cases"],
  selectorType: "select" | "plural" | "selectordinal",
): Select["cases"] {
  if (selectorType === "select") {
    return cases;
  }

  return [...cases]
    .map((selectCase, index) => ({ selectCase, index }))
    .sort((left, right) => {
      const priorityDiff =
        selectCasePriority(left.selectCase.key) -
        selectCasePriority(right.selectCase.key);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return left.index - right.index;
    })
    .map((entry) => entry.selectCase);
}

function selectCasePriority(key: string): number {
  if (isExactPluralCaseKey(key)) return 0;
  if (key === "other") return 2;
  return 1;
}

function functionAnnotation(
  name: string,
  param?: TokenList,
): Expression["annotation"] {
  const options: FunctionReference["options"] = [];
  const style = param
    ? serializeTokens(param, { inPlural: false }).trim()
    : undefined;
  if (style && style.length > 0) {
    options.push({ name: "style", value: { type: "literal", value: style } });
  }

  return {
    type: "function-reference",
    name,
    options,
  };
}

function serializeTokens(
  tokens: TokenList,
  options: { inPlural: boolean },
): string {
  let result = "";
  for (const token of tokens) {
    switch (token.type) {
      case "content":
        result += escapeText(token.value, options);
        break;
      case "argument":
        result += `{${token.arg}}`;
        break;
      case "function": {
        const style = token.param
          ? `, ${serializeTokens(token.param, { inPlural: false })}`
          : "";
        result += `{${token.arg}, ${token.key}${style}}`;
        break;
      }
      case "octothorpe":
        result += "#";
        break;
      case "select":
      case "plural":
      case "selectordinal": {
        let header = `${token.arg}, ${token.type},`;
        if (token.pluralOffset && token.pluralOffset !== 0) {
          header += ` offset:${token.pluralOffset}`;
        }
        const cases = token.cases
          .map(
            (selectCase) =>
              `${selectCase.key} {${serializeTokens(selectCase.tokens, {
                inPlural: token.type !== "select",
              })}}`,
          )
          .join(" ");
        result += `{${header} ${cases}}`;
        break;
      }
      default: {
        const exhaustive: never = token;
        throw new Error(`Unsupported token type ${(exhaustive as any)?.type}`);
      }
    }
  }
  return result;
}

function escapeText(value: string, options: { inPlural: boolean }): string {
  return escapeIcuText(value, options.inPlural);
}

function cloneBranch(branch: Branch): Branch {
  return {
    pattern: branch.pattern.map((part: Pattern[number]) => ({ ...part })),
    matches: branch.matches.map((match: Match) => ({ ...match })),
    selectOtherKeys: new Map(
      [...branch.selectOtherKeys].map(([arg, keys]) => [arg, new Set(keys)]),
    ),
    pluralOtherKeys: new Map(
      [...branch.pluralOtherKeys].map(([name, keys]) => [
        name,
        { exact: new Set(keys.exact), categories: new Set(keys.categories) },
      ]),
    ),
    path: [...branch.path],
    enclosing: branch.enclosing,
  };
}
