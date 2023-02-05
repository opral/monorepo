/**
 * This alternative uses type unions.
 */

import type * as ast from "../ast/index.js";

// ------------------------------------------------------------------------------------------------
// ast extensions

type WithLint = ast.Resource & {
  body: Array<ast.Message<MWithLint>>;
  lint: {
    errors: Array<LintResult>;
    warnings: Array<LintResult>;
    hasErrors: boolean;
    hasWarnings: boolean;
  };
};

type MWithLint = ast.Message & {
  lint: {
    errors: Array<LintResult>;
    warnings: Array<LintResult>;
  };
};

// ------------------------------------------------------------------------------------------------
// lint types

export type LintResult = {
  id: string;
  type: "warning" | "error";
  message: string;
};

// ------------------------------------------------------------------------------------------------
/// tests

export function withLint(resource: ast.Resource): ast.Resource<WithLint> {
  return resource as any;
}
