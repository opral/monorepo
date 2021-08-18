import { MissingVariableError, UnknownVariableError } from './errors'

export class InlangTextApi {
    // "Hello {user}, how are you?"
    private input: string
    // "Hallo {user}, wie geht es dir?"
    private translation: string | undefined
    // ["user"]
    private variableKeys: string[]
    // { "user": "Samuel" }
    private variables: Record<string, string | number> = {}
    // "Hallo Samuel, wie geht es dir?"
    private output: string

    constructor(text: string, args: { translation?: string } = {}) {
        this.input = text
        this.translation = args.translation
        // slicing {user} -> user
        // regex with lookbehind is not supported in safari
        this.variableKeys =
            text.match(/{.*?}/g)?.map((e) => e.slice(1, e.length - 1)) ?? []
        // if undefined use original language as fallback
        // remove as unnecessary? output can be set from args.translation
        this.output = this.translation ?? text
    }

    /**
     * @param variables e.g. { firstName: "Samuel", lastName: "Surname" }
     * @returns TranslateApi
     * @throws MissingVariableError if any variable remains undefined
     * @throws UnknownVariableError if variable key is not in input
     */
    interpolate(
        this: InlangTextApi,
        // variableskeys must be with const assertion; otherwise no typing. no solution
        // has been found yet to get static typing.
        // [key in typeof this.variables[number]]: string | number
        variables: Record<string, string | number>
    ) {
        const missingVariables = this.variableKeys.filter(
            (key) => variables[key] === undefined
        )
        const unknownVariables = Object.keys(variables).filter(
            (key) => this.variableKeys.includes(key) === false
        )
        if (missingVariables.length > 0) {
            throw new MissingVariableError(this.input, {
                specificVariable: missingVariables.toString(),
            })
        }
        if (unknownVariables.length > 0) {
            throw new UnknownVariableError(this.input, {
                specificVariable: unknownVariables.toString(),
            })
        }
        this.variables = variables
        for (const variable in this.variables) {
            this.output = this.output.replace(
                `{${variable}}`,
                this.variables[variable].toString() // toString in case its a number
            )
        }
        return this
    }

    /**
     * @returns the output
     */
    toString() {
        return this.output
    }
}
