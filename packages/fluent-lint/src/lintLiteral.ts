import { Result } from '@inlang/common';
import { Literal } from '@inlang/fluent-syntax';
import { LintArguments } from './types/LintArguments';
import { LintResult } from './types/LintResult';

// no implementation since literal can and most likely should differ between
// languages (if not, please open an issue).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function lintLiteral(args: LintArguments<Literal>): LintResult {
    return Result.ok('isOk');
}
