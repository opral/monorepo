import { Result } from '@inlang/common';
import { Entry } from '@inlang/fluent-syntax';
import { LintArguments } from './types/LintArguments';
import { LintResult } from './types/LintResult';

export function lintEntry(args: LintArguments<Entry>): LintResult {
    return Result.err(new SyntaxError('Unimplemented'));
}
