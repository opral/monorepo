import { AdapterInterface } from './index';
import { Result } from '@inlang/common';
import { parse, serialize, SingleResource } from '@inlang/fluent-syntax';

/**
 * The fluent adapter exists for ease of use of the package.
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
export class FluentAdapter implements AdapterInterface {
    parse(data: string): Result<SingleResource, Error> {
        const parsedResource = parse(data, { withSpans: false });
        const junk = parsedResource.body.filter((entry) => entry.type === 'Junk');
        if (junk.length > 0) {
            return Result.err(Error("Couldn't parse the following entries:\n" + junk.map((junk) => junk.content)));
        }
        return Result.ok(parsedResource);
    }

    serialize(resource: SingleResource): Result<string, Error> {
        const serialized = serialize(resource, { withJunk: false });
        return Result.ok(serialized);
    }
}
