import { Message, Term, Comments, parse } from '@fluent/syntax';
import { Result } from '@inlang/common';

/**
 * Parses an a fluent string to an Entry (without Junk).
 *
 * Function is a convenience wrapper around `parse` whereas junk will result
 * in an error instead of being returned. Note that only one entry at a time
 * can be parsed.
 *
 * @example
 *      parseEntry("login-hello = Welcome, { $name }, to { -brand-name }!")
 *      >> Message
 */
export function parseEntry(value: string): Result<Message | Term | Comments, Error> {
    const resource = parse(value, {});
    if (resource.body.length !== 1) {
        return Result.err(Error('Multiple entries have been parsed instead of only one.'));
    }
    if (resource.body[0].type === 'Junk') {
        return Result.err(Error('The parsing resulted in Junk (unparsable)'));
    }
    return Result.ok(resource.body[0]);
}
