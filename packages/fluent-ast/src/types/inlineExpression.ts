import type {
    FunctionReference,
    MessageReference,
    NumberLiteral,
    Placeable,
    StringLiteral,
    TermReference,
    VariableReference,
} from '../classes';

export type InlineExpression =
    | StringLiteral
    | NumberLiteral
    | FunctionReference
    | MessageReference
    | TermReference
    | VariableReference
    | Placeable;
