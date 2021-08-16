import { MissingVariableError } from './errors'

/**
 * Determines if the provided text requires interpolation of at least one variable.
 *
 * "You have {num} todos" -> requires interpolation.
 * "You have 2 todos" -> requires no interpolation.
 */
export function requiresInterpolation(text: string): boolean {
    const searchForMissingVariable = text.match('{.*?}')
    if (searchForMissingVariable && searchForMissingVariable.length > 0) {
        return true
    }
    return false
}

/**
 * Throws an error if a variable is missing.
 *
 * @param text `Hello {firstName} {lastName}`
 * @param variables `{ firstName: "Samuel", lastName: "Surname" }`
 * @returns `Hello Samuel Surname
 */
export function interpolate(
    text: string,
    variables: Record<string, string | number>
): string {
    let result = text
    for (const variable in variables) {
        if (result.match(`{${variable}}`)?.length !== 1) {
            throw new MissingVariableError(text, { specificVariable: variable })
        }
        result = result.replace(`{${variable}}`, variables[variable].toString())
    }
    // if the result still needs interpolation after all variables have been
    // interpolated -> one or more variables are missing.
    if (requiresInterpolation(result)) {
        throw new MissingVariableError(result)
    }
    return result
}
