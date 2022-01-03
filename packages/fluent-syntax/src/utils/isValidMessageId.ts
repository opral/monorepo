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
