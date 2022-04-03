import { Converter } from '../../types/converter';
import { Result } from '@inlang/result';
import { serializeResource, Resource, parseResource } from '@inlang/fluent-ast';

/**
 * The fluent converter exists for ease of use of the package.
 * In the sense that Fluent is a supported format.
 *
 * Under the hood, the converter simply calls parse and serialize
 * as exposed by the fluent syntax package i.e. no format
 * conversion is taking place. `**BUT**` In contrast to the fluent
 * implementation which is supposed to "skip" un-parsable entries,
 * the converter returns `Result.err`. Skipping un-parsable entries
 * makes sense in the context of consuming translations (otherwise
 * the app crashes, has no translations at all), but not in the
 * context of creating/editing translations. If the syntax is incorrect
 * the creator/editor of the translation should be aware of it.
 */
export class FluentConverter implements Converter {
    parse(args: { data: string }): Result<Resource, Error> {
        try {
            const parsedResource = parseResource(args.data).unwrap();
            const junk = parsedResource.body.filter((entry) => entry.type === 'Junk');
            if (junk.length > 0) {
                return Result.err(
                    Error(
                        "Couldn't parse the following entries:\n" + junk.map((junk) => junk.content)
                    )
                );
            }
            return Result.ok(parsedResource);
        } catch (error) {
            return Result.err(error as Error);
        }
    }

    serialize(args: { resource: Resource }): Result<string, Error> {
        const serialized = serializeResource(args.resource);
        return Result.ok(serialized);
    }
}
