import { LanguageCode } from '@inlang/utils';
import { Resource } from '@inlang/fluent-ast';
import { Converter } from '../types/converter';
import { SerializedResource } from '../types/serializedResource';
import { Result } from '@inlang/result';

/**
 * Serializes the provided resources.
 *
 * The provided converter determines to which file format.
 */
export function serializeResources(args: {
    converter: Converter;
    resources: { [id: string]: Resource | undefined };
}): Result<SerializedResource[], Error> {
    const files: SerializedResource[] = [];
    for (const [languageCode, resource] of Object.entries(args.resources)) {
        const serialized = args.converter.serialize({
            resource: resource as Resource,
        });
        if (serialized.isErr) {
            return Result.err(serialized.error);
        }
        files.push({ data: serialized.value, languageCode: languageCode as LanguageCode });
    }
    return Result.ok(files);
}
