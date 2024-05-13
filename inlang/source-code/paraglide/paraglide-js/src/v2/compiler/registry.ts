export type Registry = {
	[name: string]: {
		signature: {
			/**
			 * The type of the Input value
			 */
			input: string

			/**
			 * The types of the options
			 */
			options: {
				[name: string]: string
			}
		}
	}
}

export const registry: Registry = {
	plural: {
		signature: {
			input: "number",
			options: {},
		},
	},
}

export const REGISTRY_JS_FILE = ` 
/**
 * Number selection and formatting
 * 
 * @param {number} value
 * @param {{ languageTag: string }} opts
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
 */
export function number(value, opts) {
    return (new Intl.PluralRules(opts.languageTag)).select(value, opts)
}`
