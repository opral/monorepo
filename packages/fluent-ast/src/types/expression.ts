import type { SelectExpression } from '../classes';
import type { InlineExpression } from './inlineExpression';

export type Expression = InlineExpression | SelectExpression;
