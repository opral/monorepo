/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck

export type LintRule = "missing_key";

export type LintInformation = {
  type: LintRule;
  message: string;
};

export type LintResult = {
  lint?: {
    errors: Array<LintInformation>;
    warning: Array<LintInformation>;
  };
};

type Cache = string[];

export type CacheResult = {
  cache: Cache;
};

// ------------------------------------------------------------------------------------------------
// variant 1: Resource<WithLints>

export type Resource1<Extension = unknown> = {
  languageTag: string;
  body: Array<string>;
} & Extension;

const lint1 = (resource: Resource1): Resource1<LintResult> => resource as any;

const cache1 = (resource: Resource1): Resource1<CacheResult> => resource as any;

const linted1 = lint1({
  languageTag: "en",
  body: [],
});

linted1.lint;

const cached1 = cache1(linted1);

cached1.cache;
// we got rid of the `lint` property
cached1.lint;

// we would need to write it like this, but it is not possible
const lint11 = <R extends Resource1>(resource: R): R<LintResult> =>
  resource as any;

// ------------------------------------------------------------------------------------------------
// variant 2: WithLints<Resource>

export type WithLints<R extends Resource1 = Resource1> = R & LintResult;

export type WithCache<R extends Resource1 = Resource1> = R & CacheResult;

export type Resource2 = {
  languageTag: string;
  body: Array<string>;
};

const lint2 = <R extends Resource2>(resource: R): WithLints<R> =>
  resource as any;

const cache2 = <R extends Resource2>(resource: R): WithCache<R> =>
  resource as any;

const linted2 = lint2({
  languageTag: "en",
  body: [],
});

linted2.lint;

const cached2 = cache2(linted2);

cached2.cache;
cached2.lint;

// ------------------------------------------------------------------------------------------------
// variant 3: Resource & LintResult

export type Resource3 = {
  languageTag: string;
  body: Array<string>;
};

const lint3 = <R extends Resource2>(
  resource: R,
): R & { lint?: LintInformation } => resource as any;

const cache3 = <R extends Resource2>(resource: R): R & { cache: Cache } =>
  resource as any;

const linted3 = lint3({
  languageTag: "en",
  body: [],
});

linted3.lint;

const cached3 = cache3(linted3);

cached3.cache;
cached3.lint;
