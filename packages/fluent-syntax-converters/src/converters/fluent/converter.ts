import { Converter } from '../../types/converter';
import { Result } from '@inlang/common';
import { parse, serialize, SingleResource } from '@inlang/fluent-syntax';

/**
 * The fluent converter exists for ease of use of the package.
 * In the sense that Fluent is a supported format.
 *
 * Under the hood, the adapter simply calls parse and serialize
 * as exposed by the fluent syntax package i.e. no format
 * conversion is taking place. `**BUT**` In contrast to the fluent
 * implementation which is supposed to "skip" un-parsable entries,
 * the adapter returns `Result.err`. Skipping un-parsable entries
 * makes sense in the context of consuming translations (otherwise
 * the app crashes, has no translations at all), but not in the
 * context of creating/editing translations. If the syntax is incorrect
 * the creator/editor of the translation should be aware of it.
 */
export class FluentConverter implements Converter {
    parse(args: { data: string }): Result<SingleResource, Error> {
        const parsedResource = parse(args.data, { withSpans: false });
        const junk = parsedResource.body.filter((entry) => entry.type === 'Junk');
        if (junk.length > 0) {
            return Result.err(Error("Couldn't parse the following entries:\n" + junk.map((junk) => junk.content)));
        }
        return Result.ok(parsedResource);
    }

    serialize(args: { resource: SingleResource }): Result<string, Error> {
        const serialized = serialize(args.resource, { withJunk: false });
        return Result.ok(serialized);
    }
}
