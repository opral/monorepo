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
	lang: T
	textDirection: "ltr" | "rtl"
}
