import { languageTag } from "@/paraglide/runtime"

/**
 * This gets imported by both a client and a server component. It should not cause
 * either to break.
 *
 * @see https://github.com/opral/inlang-paraglide-js/issues/132
 */
export const sharedData = {
	locale: languageTag(),
}
