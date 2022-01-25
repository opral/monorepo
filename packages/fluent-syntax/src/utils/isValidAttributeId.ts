import { isValidMessageId } from '..';

/**
 * Returns whether or not the provided id is valid as attribute id.
 *
 * Implementation is a wrapper around `isValidMessageId`. Thus, any valid
 * message id is also a valid attribute id.
 *
 */
export function isValidAttributeId(id: string): boolean {
    return isValidMessageId(id);
}
