import { Result } from '@inlang/common';
import {
    Expression,
    FunctionReference,
    InlineExpression,
    Literal,
    MessageReference,
    NumberLiteral,
    SelectExpression,
    StringLiteral,
    TermReference,
    VariableReference,
} from '@inlang/fluent-syntax';
import { LintError } from './errors/LintError';
import { LintArguments } from './types/LintArguments';
import { LintResult } from './types/LintResult';

export function lintExpression(args: LintArguments<Expression>): LintResult {
    if (args.source.type !== args.target.type) {
        return Result.err(LintError.typeMismatch(args));
    }
    // since union types do not exist at runtime, this cumbersome
    // switch statement exists.
    switch (args.source.type) {
        case 'StringLiteral':
            return lintInlineExpression(args as LintArguments<InlineExpression>);
        case 'NumberLiteral':
            return lintInlineExpression(args as LintArguments<InlineExpression>);
        case 'FunctionReference':
            return lintInlineExpression(args as LintArguments<InlineExpression>);
        case 'MessageReference':
            return lintInlineExpression(args as LintArguments<InlineExpression>);
        case 'TermReference':
            return lintInlineExpression(args as LintArguments<InlineExpression>);
        case 'VariableReference':
            return lintInlineExpression(args as LintArguments<InlineExpression>);
        case 'Placeable':
            return lintInlineExpression(args as LintArguments<InlineExpression>);
        case 'SelectExpression':
            return lintSelectExpression(args as LintArguments<SelectExpression>);
        default:
            return Result.err(new LintError('Non exhaustive lint.'));
    }
}

/**
 * Lints a reference.
 *
 * The only thing that is checked is whether the id of the source and target matches.
 * All other attributes should be checked when linting the actual entity the reference
 * points to.
 */
function lintReference(
    args: LintArguments<FunctionReference | MessageReference | TermReference | VariableReference>
): LintResult {
    if (args.source.id.name !== args.target.id.name) {
        return Result.err(LintError.idMismatch(args));
    }
    return Result.ok('isOk');
}

function lintInlineExpression(args: LintArguments<InlineExpression>): LintResult {
    if (args.source.type !== args.target.type) {
        return Result.err(LintError.typeMismatch(args));
    }
    switch (args.source.type) {
        case 'FunctionReference':
            return lintReference(args as LintArguments<FunctionReference>);
        case 'MessageReference':
            return lintReference(args as LintArguments<MessageReference>);
        case 'NumberLiteral':
            return lintLiteral(args as LintArguments<NumberLiteral>);
        case 'Placeable':
            return lintExpression({ source: args.source.expression, target: args.target.expression as Expression });
        case 'StringLiteral':
            return lintLiteral(args as LintArguments<StringLiteral>);
        case 'TermReference':
            return lintReference(args as LintArguments<TermReference>);
        case 'VariableReference':
            return lintReference(args as LintArguments<VariableReference>);
        default:
            return Result.err(new LintError('Non exhaustive lint.'));
    }
}

/**
 * A select expression consists of in `InlineExpression` as selector and variants.
 *
 * Variants are not linted. See discussion #87 https://github.com/inlang/inlang/discussions/87
 */
function lintSelectExpression(args: LintArguments<SelectExpression>): LintResult {
    return lintInlineExpression({ source: args.source.selector, target: args.target.selector });
}

// no implementation since literal can and most likely should differ between
// languages (if not, please open an issue).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function lintLiteral(args: LintArguments<Literal>): LintResult {
    return Result.ok('isOk');
}
