import type { SelectExpression } from "../classes/index.js";
import type { InlineExpression } from "./inlineExpression.js";

export type Expression = InlineExpression | SelectExpression;
