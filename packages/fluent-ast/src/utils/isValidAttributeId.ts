import { isValidMessageId } from './isValidMessageId';

/**
 * Returns whether or not the provided id is valid as attribute id.
 *
 * Note if you want to check the combination of a message id with an
 * attribut id i.e. dot notation -> `hello.world`, use the `isValidId()`
 * function instead.
 *
 * @deprecated TODO Have one validId function only?
 *
 * @example
 *      isValidAttributeId("world")
 *      >> true
 *
 *      isValidAttributeId(".world")
 *      >> false
 *
 *      isValidAttributeId("hello.world")
 *      >> false
 */
export function isValidAttributeId(id: string): boolean {
    return isValidMessageId(id);
}
