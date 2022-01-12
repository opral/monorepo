import { Message, Term, Comment, Junk, parse, Entry, GroupComment, ResourceComment } from '@fluent/syntax';
import { Result } from '@inlang/common';

// overloads
export function parseEntry(value: string, options: { expectType: 'Comment' }): Result<Comment, Error>;
export function parseEntry(value: string, options: { expectType: 'GroupComment' }): Result<GroupComment, Error>;
export function parseEntry(value: string, options: { expectType: 'ResourceComment' }): Result<ResourceComment, Error>;
export function parseEntry(value: string, options: { expectType: 'Message' }): Result<Message, Error>;
export function parseEntry(value: string, options: { expectType: 'Term' }): Result<Term, Error>;
export function parseEntry(value: string, options: { expectType: 'Junk' }): Result<Junk, Error>;

/**
 * Parses an a fluent string to an Entry (without Junk).
 *
 * @example
 *      parseEntry("login-hello = Welcome, { $name }, to { -brand-name }!", { expectType: "Message" })
 *      >> Result.ok(Message)
 *
 *      parseEntry("login-hello = Welcome, { $name }, to { -brand-name }!", { expectType: "Term" })
 *      >> Result.err(Error)
 */
export function parseEntry(value: string, options: { expectType: Entry['type'] }): Result<Entry, Error> {
    // ignore the spans when parsing -> `serialize` will format entry correctly
    const resource = parse(value, { withSpans: false });
    if (resource.body.length !== 1) {
        return Result.err(Error('Multiple entries have been parsed instead of only one.'));
    }
    const entry = resource.body[0];
    if (options.expectType && entry.type !== options.expectType) {
        if (entry.type === 'Junk') {
            return Result.err(Error('The syntax contains an error.'));
        }
        return Result.err(Error(`The parsed type is "${entry.type}" and not the expected "${options.expectType}".`));
    }
    return Result.ok(resource.body[0]);
}
