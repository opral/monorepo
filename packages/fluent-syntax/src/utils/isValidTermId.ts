import { isValidMessageId } from "./isValidMessageId";

/**
 * A term id is valid if the term is prefixed with a `-` and is a valid
 * message id.
 *
 * A term can be referenced by messages. Read more about terms here
 * https://projectfluent.org/fluent/guide/terms.html
 */
export function isValidTermId(id: string): boolean {
    if (id.startsWith('-') && isValidMessageId(id.slice(1, id.length))) {
        return true;
    }
    return false;
}
