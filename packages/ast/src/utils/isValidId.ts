import { Identifier } from '../classes';
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
export function isValidId(id: string | Identifier): boolean {
    const _id = id instanceof Identifier ? id.name : id;
    const split = _id.split('.');
    switch (split.length) {
        case 1:
            return isValidMessageId(_id);
        case 2:
            return isValidMessageId(split[0]) && isValidAttributeId(split[1]);
        // more than one dot (one attribute) is not allowed in fluent
        default:
            return false;
    }
}

/**
 * Utility function to have consistent error messages and reduce boilerplate.
 */
// defining the reasons as return type union leads to nice DX because
// conditional logic can be used e.g. invalidIdReason(x) === "The id is valid." etc.
/* istanbul ignore next */
export function invalidIdReason(
    id: string
):
    | 'The id is valid.'
    | 'The id can not be empty.'
    | 'Expected attribute id.'
    | 'Fluent only supports one layer of attributes.'
    | 'Invalid character.' {
    const split = id.split('.');
    if (isValidId(id)) {
        return 'The id is valid.';
    } else if (id.length === 0) {
        return 'The id can not be empty.';
    }
    // attribute id has not been entered yet (which is no error but leads to an invalid id)
    // length === 2 because `hello.`.split('.') = ['hello', '']
    else if (split.length === 2 && id.includes('.')) {
        return 'Expected attribute id.';
    } else if (split.length > 2) {
        return 'Fluent only supports one layer of attributes.';
    } else {
        return 'Invalid character.';
    }
}
