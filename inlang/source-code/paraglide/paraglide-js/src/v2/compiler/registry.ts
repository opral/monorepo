export const REGISTRY = `import 
/**
 * @param {number} value
 * @param {{ languageTag: string }} opts
 */
export function plural(value, opts) {
    return (new Intl.PluralRules(opts.languageTag)).select(value, opts)
}`
