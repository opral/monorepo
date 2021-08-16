export class MissingVariableError extends Error {
    constructor(text: string, args: { specificVariable?: string } = {}) {
        super(`Missing ${args.specificVariable ?? 'variable'} for ` + text)
    }
}
