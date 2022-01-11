import { Result } from '@inlang/common';
import { Pattern } from '@inlang/fluent-syntax';
import { lintPatternElement } from './lintPatternElement';
import { LintArguments } from './types/LintArguments';
import { LintResult } from './types/LintResult';

export function lintPattern(args: LintArguments<Pattern>): LintResult {
    for (const sourceElement of args.source.elements) {
        const lint = lintPatternElement({ source: sourceElement, target: sourceElement });
        if (lint.isErr) {
            return Result.err(lint.error);
        }
    }
    return Result.ok('isOk');
}
