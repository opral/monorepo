/**
 * Creates a greeting string for the given name
 *
 * @param name - The name to greet
 * @returns The greeting string
 */
function greetings(name = 'world'): string {
    return `Hello ${name}`;
}

export default greetings;
