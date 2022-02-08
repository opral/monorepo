import { LanguageCode, Result } from '@inlang/common';
import { Resources, SingleResource } from '@inlang/fluent-syntax';
import { converters } from '..';
import { SerializedResource } from '../types/serializedResource';
import { SupportedFormat } from '../types/supportedFormat';

/**
 * Serializes the provided resources.
 *
 * The provided converter determines to which file format.
 */
export function serializeResources(args: {
    format: SupportedFormat;
    resources: Resources;
}): Result<SerializedResource[], Error> {
    const files: SerializedResource[] = [];
    for (const [languageCode, resource] of Object.entries(args.resources.resources)) {
        const serialized = converters[args.format].serialize({
            resource: resource as SingleResource,
        });
        if (serialized.isErr) {
            return Result.err(serialized.error);
        }
        files.push({ data: serialized.value, languageCode: languageCode as LanguageCode });
    }
    return Result.ok(files);
}
