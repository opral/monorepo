import { Locale } from './types'

export abstract class InlangError extends Error {}

export class MissingVariableError extends InlangError {
    constructor(input: string, args: { specificVariable?: string } = {}) {
        super(`Missing ${args.specificVariable ?? 'variable'} for ` + input)
    }
}

export class UnknownVariableError extends InlangError {
    constructor(input: string, args: { specificVariable?: string } = {}) {
        super(`Unknown variable ${args.specificVariable} for + input`)
    }
}

export class TranslationsDoNotExistError extends InlangError {
    constructor(args: { locale: Locale }) {
        super(`Translations for the specified locale "${args.locale}" 
            do not exist (yet). If the warning is unexpected, have you published your changes?`)
    }
}

export class UnknownError extends InlangError {
    constructor(message: string) {
        super(message)
    }
}
