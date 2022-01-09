import { Result } from '@inlang/common';
import { PatternElement, TextElement } from '@inlang/fluent-syntax';
import { LintError } from './errors/LintError';
import { LintArguments } from './types/LintArguments';
import { LintResult } from './types/LintResult';

export function lintPatternElement(args: LintArguments<PatternElement>): LintResult {
    return Result.err(new LintError('unimplemented.'));
}

function lintTextElement(args: LintArguments<TextElement>): LintResult {
    return Result.ok('isOk');
}
