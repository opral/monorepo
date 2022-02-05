import { isValidMessageId } from './isValidMessageId';

/**
 * Returns whether or not the provided id is valid as attribute id.
 *
 * Note that have to check yourself whether the combination of message
 * id and attribute id is correct.
 *
 * @example
 *      const x = "hello.world"
 *      isValidMessageId(x.split('.')[0]) && isValidAttributeId(x.split('.')[1])
 *      >> true
 */
export function isValidAttributeId(id: string): boolean {
    return isValidMessageId(id);
}
