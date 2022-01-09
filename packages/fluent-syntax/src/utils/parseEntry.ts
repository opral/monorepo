import { Message, Term, Comment, Junk, parse, Entry, GroupComment, ResourceComment } from '@fluent/syntax';
import { Result } from '@inlang/common';

// overloads
export function parseEntry(value: string, options: { expectType: 'Comment' }): Result<Comment, Error>;
export function parseEntry(value: string, options: { expectType: 'GroupComment' }): Result<GroupComment, Error>;
export function parseEntry(value: string, options: { expectType: 'ResourceComment' }): Result<ResourceComment, Error>;
export function parseEntry(value: string, options: { expectType: 'Message' }): Result<Message, Error>;
export function parseEntry(value: string, options: { expectType: 'Term' }): Result<Term, Error>;
export function parseEntry(value: string, options: { expectType: 'Junk' }): Result<Junk, Error>;
export function parseEntry(value: string, options: { expectType: Entry['type'] }): Result<Entry, Error>;

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
    const resource = parse(value, {});
    if (resource.body.length !== 1) {
        return Result.err(Error('Multiple entries have been parsed instead of only one.'));
    }
    const entry = resource.body[0];
    if (entry.type !== options.expectType) {
        return Result.err(Error(`The parsed type is "${entry.type}" and not the expected "${options.expectType}"`));
    }
    return Result.ok(resource.body[0]);
}
