/**
 * The interface for Paraglide's Locals, available under `event.locals.paraglide`
 *
 * @example
 * ```ts
 * // src/app.d.ts
 * import type { AvailableLanguageTag } from "$lib/paraglide/runtime"
 * import type { ParaglideLocals } from "@inlang/paraglide-sveltekit"
 *
 * declare global {
 *   namespace App {
 *     interface Locals {
 *       paraglide: ParaglideLocals<AvailableLanguageTag>
 *     }
 *   }
 * }
 * ```
 */
export type ParaglideLocals<T extends string> = {
	/**
	 * The language that's being used for the current request.
	 * @deprecated As of `v0.10` you can just call `languageTag()` on the server
	 */
	lang: T

	/**
	 * The text-direction present on the `<html>` tag
	 */
	textDirection: "ltr" | "rtl"
}
