import { Result } from '@inlang/common';
import { PatternElement, Placeable, TextElement } from '@inlang/fluent-syntax';
import { LintError } from './errors/LintError';
import { lintExpression } from './lintExpression';
import { LintArguments } from './types/LintArguments';
import { LintResult } from './types/LintResult';

export function lintPatternElement(args: LintArguments<PatternElement>): LintResult {
    if (args.source.type !== args.target.type) {
        return Result.err(LintError.typeMismatch(args));
    }
    switch (args.source.type) {
        case 'Placeable':
            return lintExpression({ source: args.source.expression, target: args.target.expression as Placeable });
        case 'TextElement':
            return lintTextElement(args as LintArguments<TextElement>);
        default:
            return Result.err(new LintError('Non exhaustive switch statement.'));
    }
}

/**
 * Nothing linted. Text elements are supposed to be different.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function lintTextElement(args: LintArguments<TextElement>): LintResult {
    return Result.ok('isOk');
}
