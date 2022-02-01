/**
 * Returns whether a message id is valid.
 *
 * Read more about messages here https://projectfluent.org/fluent/guide/hello.html
 */
export function isValidMessageId(id: string): boolean {
    if (id === '') {
        return false;
    }
    // regex written based on https://github.com/projectfluent/fluent.js/blob/a58dbf09ccca1ce73ec0af37df92052cd97c9c95/fluent-syntax/src/stream.ts#L307
    // eslint-disable-next-line unicorn/better-regex
    const idCharacterRegex = /[a-z]|[A-Z]|[0-9]|_|-/;
    // every character if the id must be truthy when tested against the regex.
    if (id.startsWith('-') === false && [...id].every((character) => idCharacterRegex.test(character))) {
        return true;
    }
    return false;
}
