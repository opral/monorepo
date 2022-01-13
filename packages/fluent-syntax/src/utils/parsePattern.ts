import { Result } from '@inlang/common';
import { Message, parseEntry, ParseError, Pattern } from '..';

export function parsePattern(source: string): Result<Pattern, ParseError> {
    // wrapping the pattern as message to parse it
    const entry = parseEntry('placeholder-id = ' + source);
    if (entry.isErr) {
        return Result.err(entry.error);
    }
    // return type is a message that contains a pattern (checked above)
    return Result.ok((entry.value as Message).value as Pattern);
}
