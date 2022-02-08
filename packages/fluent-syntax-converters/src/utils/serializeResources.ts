import { LanguageCode, Result } from '@inlang/common';
import { Resources, SingleResource } from '@inlang/fluent-syntax';
import { Converter } from '../types/converter';
import { SerializedResource } from '../types/serializedResource';

/**
 * Serializes the provided resources.
 *
 * The provided converter determines to which file format.
 */
export function serializeResources(args: {
    converter: Converter;
    resources: Resources;
}): Result<SerializedResource[], Error> {
    const files: SerializedResource[] = [];
    for (const [languageCode, resource] of Object.entries(args.resources.resources)) {
        const serialized = args.converter.serialize({
            resource: resource as SingleResource,
        });
        if (serialized.isErr) {
            return Result.err(serialized.error);
        }
        files.push({ data: serialized.value, languageCode: languageCode as LanguageCode });
    }
    return Result.ok(files);
}
