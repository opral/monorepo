import { paraglide as unpluginParaglide, type UserConfig } from "@inlang/paraglide-unplugin"

export const paraglide: (config: UserConfig) => any = unpluginParaglide.webpack

/**
 * @deprecated - Please use the named export '{ paraglide }' instead.
 */
export default (config: UserConfig) => {
	console.warn(
		"The default export of `@inlang/paraglide-js-adapter-webpack` is deprecated.\nPlease use the named export '{ paraglide }' instead."
	)
	return paraglide(config)
}
