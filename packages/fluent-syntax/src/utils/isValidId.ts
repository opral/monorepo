import { isValidAttributeId } from './isValidAttributeId';
import { isValidMessageId } from './isValidMessageId';

/**
 * Returns whether the provided id is valid either as standalone
 * message id, or a message with an attribute id.
 *
 * This is a utility function to increase compatibility with the
 * common pattern of referencing attributes with dot notation
 * i.e. `hello.world` -> attribute `world`.
 *
 * @example
 *      // a message id
 *      isValidId("hello")
 *      >> true
 *
 *      // a message with attribute as combined id
 *      isValidId("hello.world")
 *      >> true
 *
 *      isValidId(".world")
 *      >> false
 *
 */
export function isValidId(id: string): boolean {
    const split = id.split('.');
    switch (split.length) {
        case 1:
            return isValidMessageId(id);
        case 2:
            return isValidMessageId(split[0]) && isValidAttributeId(split[1]);
        // more than one dot (one attribute) is not allowed in fluent
        default:
            return false;
    }
}
