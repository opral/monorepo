import type { LanguageTag, Message, Variant } from "../versionedInterfaces.js";
import type { Result } from "@inlang/result";
import {
  MessagePatternsForLanguageTagDoNotExistError,
  MessageVariantAlreadyExistsError,
  MessageVariantDoesNotExistError,
} from "./errors.js";

/**
 * Tries to match the most specific variant of a message.
 *
 * The selectors determine the specificity of a variant. If no selectors are provided,
 * or if the selectors do not match any variant, the catch all variant is returned
 * (if it exists).
 *
 * @example
 * 	const variant = getVariant(message, { where: { languageTag: "en", match: ["male"]}});
 */
export function getVariant(
  message: Message,
  args: {
    where: {
      languageTag: LanguageTag;
      match?: Variant["match"];
    };
  },
): Variant | undefined {
  const variant = matchMostSpecificVariant(
    message,
    args.where.languageTag,
    args.where.match,
  );
  if (variant) {
    //! do not return a reference to the message in a resource
    //! modifications to the returned message will leak into the
    //! resource which is considered to be immutable.
    return structuredClone(variant);
  }
  return undefined;
}

/**
 * Create a variant for a message
 *
 * All actions are immutable.
 *
 * @example
 *  const message = createVariant(message, { languageTag: "en", data: variant })
 */
export function createVariant(
  message: Message,
  args: {
    data: Variant;
  },
): Result<Message, MessageVariantAlreadyExistsError> {
  const copy = structuredClone(message);

  // check if variant already exists
  if (matchVariant(copy, args.data.languageTag, args.data.match)) {
    return {
      error: new MessageVariantAlreadyExistsError(
        message.id,
        args.data.languageTag,
      ),
    };
  }

  copy.variants.push({
    ...args.data,
    match: args.data.match,
  });
  return { data: copy };
}

/**
 * Update a variant of a message
 *
 * All actions are immutable.
 *
 * @example
 *  const message = updateVariant(message, { languageTag: "en", match: ["male"], pattern: []})
 */
export function updateVariantPattern(
  message: Message,
  args: {
    where: {
      languageTag: LanguageTag;
      match: Variant["match"];
    };
    data: Variant["pattern"];
  },
): Result<
  Message,
  MessageVariantDoesNotExistError | MessagePatternsForLanguageTagDoNotExistError
> {
  const copy = structuredClone(message);

  const containsLanguageTag = message.variants.some(
    (variant) => variant.languageTag === args.where.languageTag,
  );
  if (!containsLanguageTag) {
    return {
      error: new MessagePatternsForLanguageTagDoNotExistError(
        message.id,
        args.where.languageTag,
      ),
    };
  }

  const variant = matchVariant(copy, args.where.languageTag, args.where.match);
  if (variant === undefined) {
    return {
      error: new MessageVariantDoesNotExistError(
        message.id,
        args.where.languageTag,
      ),
    };
  }
  if (variant) {
    variant.pattern = args.data;
    return { data: copy };
  }
  return {
    error: new MessageVariantDoesNotExistError(
      message.id,
      args.where.languageTag,
    ),
  };
}

/**
 * Returns the specific variant defined by selectors or undefined
 *
 * @example
 *  const variant = matchVariant(message, languageTag: "en", match: ["male"])
 */
const matchVariant = (
  message: Message,
  languageTag: LanguageTag,
  match: Variant["match"],
): Variant | undefined => {
  const languageVariants = message.variants.filter(
    (variant) => variant.languageTag === languageTag,
  );
  if (languageVariants.length === 0) return undefined;

  for (const variant of languageVariants) {
    let isMatch = true;
    //check if vaiant is a match
    if (variant.match.length > 0) {
      variant.match.map((value, index) => {
        if (match && match[index] !== value) {
          isMatch = false;
        }
      });
    }

    if (
      !message.selectors ||
      !match ||
      match.length !== message.selectors.length
    ) {
      isMatch = false;
    }

    if (isMatch) {
      return variant;
    }
  }
  return undefined;
};

/**
 * Returns the most specific variant of a message.
 *
 * @example
 *  const variant = matchMostSpecificVariant(message, languageTag: "en", selectors: { gender: "male" })
 */
const matchMostSpecificVariant = (
  message: Message,
  languageTag: LanguageTag,
  match?: Variant["match"],
): Variant | undefined => {
  // resolve preferenceSelectors to match length and order of message selectors
  const index: Record<string, any> = {};

  for (const variant of message.variants) {
    if (variant.languageTag !== languageTag) continue;

    let isMatch = true;

    // if slector and stored match are not the same throw error
    if (variant.match.length !== message.selectors.length) {
      return undefined;
    }

    //check if variant is a match
    if (variant.match.length > 0) {
      variant.match.map((value, index) => {
        if (match && match[index] !== value && value !== "*") {
          isMatch = false;
        }
      });
    }
    if (isMatch && match && match.length > 0) {
      // eslint-disable-next-line no-inner-declarations
      function recursiveAddToIndex(
        currentIndex: Record<string, any>,
        selectorIndex: number,
        selectorLength: number,
        variant: Variant,
      ) {
        const key = variant.match[selectorIndex];
        if (key) {
          if (selectorIndex === 1) {
            currentIndex[key] = variant;
          } else {
            if (!currentIndex[key]) {
              currentIndex[key] = {};
            }
            recursiveAddToIndex(
              currentIndex[key],
              selectorIndex + 1,
              selectorLength,
              variant,
            );
          }
        }
      }
      recursiveAddToIndex(
        index,
        0,
        message.selectors ? message.selectors.length - 1 : 0,
        variant,
      );
    } else if (isMatch && !match) {
      return variant;
    }
  }

  // if number of selectors and numver of required match is not the same match catch all
  if (
    !message.selectors ||
    !match ||
    match.length !== message.selectors.length
  ) {
    const catchAllMatcher: Array<string> = [];
    const selectorCount = message.selectors.length;
    catchAllMatcher.push("*");
    for (let i = 0; i < selectorCount - 1; i++) {
      catchAllMatcher.push("*");
    }
    return message.variants.find(
      (v) =>
        v.languageTag === languageTag &&
        JSON.stringify(v.match) === JSON.stringify(catchAllMatcher),
    );
  }

  // if selector is empty match empty variant match
  if (message.selectors && message.selectors.length === 0) {
    return message.variants.find(
      (v) => v.languageTag === languageTag && JSON.stringify(v.match) === "[]",
    );
  }

  //find the most specific variant
  const findOptimalMatch = (
    index: Record<string, any>,
    selectors: string[],
  ): Variant | undefined => {
    const keys = Object.keys(index);

    for (const key of keys) {
      if (key === selectors[0] || key === "*") {
        const nextOptimal = selectors.slice(1);

        if (nextOptimal.length === 0) {
          return (index[key] as Variant) || undefined;
        }

        const match = findOptimalMatch(
          index[key] as Record<string, any>,
          nextOptimal,
        );

        if (match !== undefined) {
          return match;
        }
      }
    }
    return undefined;
  };

  return findOptimalMatch(index, match || []);
};
