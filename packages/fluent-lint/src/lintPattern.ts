import { Result } from '@inlang/common';
import { Pattern } from '@inlang/fluent-syntax';
import { LintArguments } from './types/LintArguments';
import { LintResult } from './types/LintResult';

export function lintPattern(args: LintArguments<Pattern>): LintResult {
    return Result.err(new SyntaxError('Unimplemented'));
}
