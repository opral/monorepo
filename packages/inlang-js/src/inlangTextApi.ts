import { MissingVariableError, UnknownVariableError } from './errors'
import { Locale, PluralRules, SingleTranslation } from './types'

export class InlangTextApi {
    // "Hello {user}, how are you?"
    #input: string
    // "de"
    #locale: Locale
    // "Hallo {user}, wie geht es dir?"
    #translation: SingleTranslation | undefined
    // ["user"]
    #variableKeys: string[]
    // { "user": "Samuel" }
    #variables: Record<string, string | number | InlangTextApi> = {}
    // "Hello Samuel, how are you?"
    #output: string
    // "Hallo Samuel, wie geht es dir?"
    // toString()

    constructor(
        text: string,
        args: {
            translation?: SingleTranslation
            locale: Locale
        }
    ) {
        this.#input = text
        this.#translation = args.translation
        this.#locale = args.locale
        // slicing {user} -> user
        // regex with lookbehind is not supported in safari
        this.#variableKeys =
            text.match(/{.*?}/g)?.map((e) => e.slice(1, e.length - 1)) ?? []
        // if undefined use original language as fallback
        // remove as unnecessary? output can be set from args.translation
        this.#output = args.translation ?? text
    }

    /**
     * Interpolates this.#variables into #this.output.
     *
     * Interpolation has to happen at the end of the `pipeline` and is therefore
     * not happening directly in `.variables()`.
     */
    static #interpolate(
        input: string,
        variables: Record<string, string | number | InlangTextApi>
    ): string {
        let result = input
        for (const variable in variables) {
            result = result.replace(
                `{${variable}}`,
                variables[variable].toString() // toString in case its a number
            )
        }
        return result
    }

    /**
     * @param variables e.g. { firstName: "Samuel", lastName: "Surname" }
     * @returns TranslateApi
     * @throws MissingVariableError if any variable remains undefined
     * @throws UnknownVariableError if variable key is not in input
     */
    variables(
        this: InlangTextApi,
        // variableskeys must be with const assertion; otherwise no typing. no solution
        // has been found yet to get static typing.
        // [key in typeof this.variables[number]]: string | number
        variables: Record<string, string | number | InlangTextApi> | undefined
    ): InlangTextApi {
        if (variables === undefined) {
            return this
        }
        const missingVariables = this.#variableKeys.filter(
            (key) => variables[key] === undefined
        )
        const unknownVariables = Object.keys(variables).filter(
            (key) => this.#variableKeys.includes(key) === false
        )
        if (missingVariables.length > 0) {
            throw new MissingVariableError(this.#input, {
                specificVariable: missingVariables.toString(),
            })
        }
        if (unknownVariables.length > 0) {
            throw new UnknownVariableError(this.#input, {
                specificVariable: unknownVariables.toString(),
            })
        }
        this.#variables = variables
        return this
    }

    /**
     * @deprecated subject of breaking changes. Use as "playground"/
     * base for better implementation.
     */
    plurals(num: number, plurals: PluralRules): InlangTextApi {
        // Zero should be zero in any language.
        if (num === 0) {
            this.#output = plurals.zero ?? this.#output
            return this
        }
        const rule = new Intl.PluralRules(this.#locale).select(num)
        switch (rule) {
            case 'zero':
                this.#output = plurals.zero ?? this.#output
                break
            case 'one':
                this.#output = plurals.one ?? this.#output
                break
            case 'two':
                this.#output = plurals.two ?? this.#output
                break
            case 'few':
                this.#output = plurals.few ?? this.#output
                break
            case 'many':
                this.#output = plurals.many ?? this.#output
                break
        }
        return this
    }

    /**
     * @returns the output
     */
    toString() {
        this.#output = InlangTextApi.#interpolate(this.#output, this.#variables)
        return this.#output
    }
}
