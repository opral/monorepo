import { kebabCase, snakeCase, camelCase } from 'lodash';

/**
 * A message id is valid if the id is kebap-case, snake_case, or camelCase.
 *
 * Read more about messages here https://projectfluent.org/fluent/guide/hello.html
 */
export function isValidMessageId(id: string): boolean {
    if ((id.startsWith('-') === false && id === kebabCase(id)) || id === snakeCase(id) || id === camelCase(id)) {
        return true;
    }
    return false;
}

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
