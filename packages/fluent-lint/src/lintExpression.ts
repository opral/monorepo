import { Result } from '@inlang/common';
import { Expression, FunctionReference, MessageReference, TermReference } from '@inlang/fluent-syntax';
import { LintError } from './errors/LintError';
import { LintArguments } from './types/LintArguments';
import { LintResult } from './types/LintResult';
import { typeMismatch } from './utils/typeMismatch';

export function lintExpression(args: LintArguments<Expression>): LintResult {
    if (args.source.type !== args.target.type) {
        return Result.err(typeMismatch(args));
    }
    return Result.err(new LintError('Unimplemented'));
}

function lintFunctionReference(args: LintArguments<FunctionReference>): LintResult {
    if (args.source.id !== args.target.id) {
        return Result.err();
    }
    return Result.err(new LintError('Unimplemented.'));
}

function lintMessageReference(args: LintArguments<MessageReference>): LintResult {
    return Result.err(new LintError('Unimplemented.'));
}

function lintTermReference(args: LintArguments<TermReference>): LintResult {
    return Result.err(new LintError('Unimplemented.'));
}

function lintVaribaleReference(args: LintArguments<TermReference>): LintResult {
    return Result.err(new LintError('Unimplemented'));
}
