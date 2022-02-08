import { Result } from '@inlang/common';
import { Resource, Resources } from '@inlang/fluent-syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { SerializedResource } from '../types/serializedResource';

/**
 * Parses serialized resources.
 *
 * The provided adapter determines from which file format.
 */
export function parseResources(args: {
    adapter: AdapterInterface;
    files: SerializedResource[];
}): Result<Resources, Error> {
    const resources: Record<string, Resource | undefined> = {};
    for (const file of args.files) {
        const parsed = args.adapter.parse(file.data);
        if (parsed.isErr) {
            return Result.err(parsed.error);
        }
        resources[file.languageCode] = parsed.value;
    }
    return Result.ok(new Resources({ resources }));
}
