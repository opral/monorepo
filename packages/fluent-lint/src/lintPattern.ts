import { Result } from '@inlang/common';
import { Pattern, Reference } from '@inlang/fluent-syntax';
import { lowerCase } from 'lodash';
import { LintError } from './errors/lintError';
import { LintArguments } from './types/lintArguments';
import { LintResult } from './types/lintResult';
import { doesReferenceExist } from './utils/doesReferenceExist';
import { referencesInPattern } from './utils/referencesInPattern';

/**
 * Lints the references in the patterns.
 *
 * The function checks whether all references in the source and target are matching
 * based on their Id and Type.
 */
export function lintPattern(args: LintArguments<Pattern, Pattern>): LintResult {
    // source -> target
    // do all references in source also exist in target?
    const sourceReferences = referencesInPattern(args.source);
    for (const sourceReference of sourceReferences) {
        if (doesReferenceExist({ reference: sourceReference, pattern: args.target }) === false) {
            return Result.err(
                new LintError(`The ${formatType(sourceReference.type)} "${sourceReference.id.name}" is missing.`)
            );
        }
    }
    // target -> source
    // do all references in target also exist in source?
    const targetReferences = referencesInPattern(args.target);
    for (const targetReference of targetReferences) {
        if (doesReferenceExist({ reference: targetReference, pattern: args.source }) === false) {
            return Result.err(
                new LintError(
                    `The ${formatType(targetReference.type)} "${targetReference.id.name}" does not exist in the source.`
                )
            );
        }
    }
    return Result.ok('isOk');
}

/**
 * Formats a reference type.
 *
 * @example
 *      formattedType("VariableReference")
 *      >> 'variable reference'
 */
function formatType(type: Reference['type']): string {
    return lowerCase(type.split(/(?=[A-Z])/).join(' '));
}
