/**
 * This alternative uses type unions.
 */

import type * as ast from "../ast/index.js";

// ------------------------------------------------------------------------------------------------
// ast extensions

type WithCache = {
  cache: {
    index: 5;
  };
};

// ------------------------------------------------------------------------------------------------
// lint types

// ------------------------------------------------------------------------------------------------
/// tests

export function withCache<T extends ast.Resource, U extends T & WithCache>(
  resource: T
): U {
  return resource as any;
}
