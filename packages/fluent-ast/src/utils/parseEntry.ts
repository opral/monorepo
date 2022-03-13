import { Message, Term, FluentParser, Comments, ParseError } from '@fluent/syntax';
import { Result } from '../../../utils/dist';

/**
 * Parses an a fluent string to an Entry (without Junk).
 *
 * @example
 *      parseEntry("login-hello = Welcome, { $name }, to { -brand-name }!")
 *      >> Result.ok(Message)
 *
 *      parseEntry("login-hello = Welcome, { }, to { -brand-name }!")
 *      >> Result.err(ParseError)
 */
export function parseEntry(serializedEntry: string): Result<Message | Term | Comments, ParseError> {
    const parser = new FluentParser({ withSpans: false });
    const entry = parser.parseEntry(serializedEntry);
    if (entry.type === 'Junk') {
        return Result.err(new ParseError(entry.annotations[0].code));
    }
    return Result.ok(entry);
}
