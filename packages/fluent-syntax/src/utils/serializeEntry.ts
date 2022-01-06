import { Entry, Resource, serialize } from '@fluent/syntax';
import { trim } from 'lodash';

/**
 * Serializes an `Entry` to a fluent string.
 *
 * @argument options.withoutId only applies to `Message` and `Term`.
 *
 * @example
 *      serializeEntry(message, {})
 *      >> "login-hello = Welcome, { $name }, to { -brand-name }!"
 *
 *      serializeEntry(message, { withoutId: true })
 *      >> "Welcome, { $name }, to { -brand-name }!"
 */
export function serializeEntry(entry: Entry, options?: { withoutId?: true }): string {
    const asResource = new Resource([entry]);
    // `serialize` serializes the entry as resource. Therefore,
    // whitespace is included (fluent is whitespace sensitive)
    // which needs to be trimmed.
    const serialized = trim(serialize(asResource, {}));
    if (options?.withoutId) {
        return trim(serialized.slice(serialized.indexOf('=') + 1));
    }
    return serialized;
}
