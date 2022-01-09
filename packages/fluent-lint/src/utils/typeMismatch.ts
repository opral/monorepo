import { BaseNode } from '@inlang/fluent-syntax';
import { LintError } from '../errors/LintError';
import { LintArguments } from '../types/LintArguments';
import { lintErrorMessage } from './lintErrorMessage';

/**
 * Util function for common type mismatch.
 *
 */
export function typeMismatch(args: LintArguments<BaseNode>): LintError {
    return new LintError(
        lintErrorMessage({ expectedSourceToBe: args.source.type, expectedTargetToBe: args.source.type })
    );
}
