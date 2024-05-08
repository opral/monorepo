import { DEV } from "./env"

/* @__NO_SIDE_EFFECTS__ */
export function initializeLanguage() {
	if (DEV) throw new Error("initializeLanguage is not available on the client")
}
