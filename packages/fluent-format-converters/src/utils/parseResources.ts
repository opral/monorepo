import { Result } from '@inlang/result';
import { Resource } from '@inlang/fluent-ast';
import { Converter } from '../types/converter';
import { SerializedResource } from '../types/serializedResource';

/**
 * Parses serialized resources.
 *
 * The provided converter determines from which file format.
 */
export function parseResources(args: {
    converter: Converter;
    files: SerializedResource[];
}): Result<{ [id: string]: Resource | undefined }, Error> {
    const resources: Record<string, Resource | undefined> = {};
    for (const file of args.files) {
        const parsed = args.converter.parse({ data: file.data });
        if (parsed.isErr) {
            return Result.err(parsed.error);
        }
        resources[file.languageCode] = parsed.value;
    }
    return Result.ok(resources);
}
