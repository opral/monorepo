import { Result } from '@inlang/common';
import { Comments, Entry, Message, Term } from '@inlang/fluent-syntax';
import { LintError } from './errors/LintError';
import { lintComments } from './lintComments';
import { lintPattern } from './lintPattern';
import { LintArguments } from './types/LintArguments';
import { LintResult } from './types/LintResult';

export function lintEntry(args: LintArguments<Entry>): LintResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((args.source.id as any)?.name !== (args.target.id as any)?.name) {
        return Result.err(LintError.typeMismatch(args));
    }
    switch (args.source.type) {
        case 'Comment':
            return lintComments(args as LintArguments<Comments>);
        case 'GroupComment':
            return lintComments(args as LintArguments<Comments>);
        case 'ResourceComment':
            return lintComments(args as LintArguments<Comments>);
        case 'Junk':
            // junk is skipped in accordance with the fluent spec
            // (+ both source and target must be junk here)
            return Result.ok('isOk');
        case 'Message':
            return lintMessageOrTerm(args as LintArguments<Message | Term>);
        case 'Term':
            return lintMessageOrTerm(args as LintArguments<Message | Term>);
        default:
            return Result.err(new LintError('Non exhaustive switch statement.'));
    }
}

function lintMessageOrTerm(args: LintArguments<Message | Term>): LintResult {
    if (args.source.id.name !== args.target.id.name) {
        return Result.err(LintError.idMismatch(args));
    }
    // checking if the patterns of the messages are correct
    if (
        (args.source.value === null && args.target.value !== null) ||
        (args.source.value !== null && args.target.value === null)
    ) {
        return Result.err(
            new LintError(
                `Different message pattern: Expected ${args.source.value ?? 'empty message'} but received ${
                    args.target.value ?? 'empty message'
                }.`
            )
        );
    } else if (args.source.value && args.target.value) {
        const lintValues = lintPattern({ source: args.source.value, target: args.target.value });
        if (lintValues.isErr) {
            return Result.err(lintValues.error);
        }
    }
    // linting the attributes of the messages (which are patterns)
    for (const sourceAttribute of args.source.attributes) {
        const targetAttribute = args.target.attributes.find(
            (attribute) => attribute.id.name === sourceAttribute.id.name
        );
        if (targetAttribute === undefined) {
            return Result.err(new LintError(`Missing attribute: ${sourceAttribute.id.name}`));
        }
        const lint = lintPattern({ source: sourceAttribute.value, target: targetAttribute.value });
        if (lint.isErr) {
            return Result.err(lint.error);
        }
    }
    return Result.ok('isOk');
}
