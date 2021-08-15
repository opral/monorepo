/**
 * Throws an error if a variable is missing.
 *
 * @param text `Hello {firstName} {lastName}`
 * @param variables `{ firstName: "Samuel", lastName: "Surname" }`
 * @returns `Hello Samuel Surname
 */
export function interpolate(
    text: string,
    variables: Record<string, string>
): string {
    let result = text
    for (const variable in variables) {
        result = result.replace(`{${variable}}`, variables[variable])
    }
    const searchForMissingVariable = result.match('{.*}')
    if (searchForMissingVariable && searchForMissingVariable.length > 0) {
        throw Error(`Missing variable '${searchForMissingVariable[0]}'`)
    }
    return result
}
