import { createLink } from "./Link.base"
import { getLanguage } from "./getLanguage.server"

/**
 * React Component that enables client-side transitions between routes.
 * 
 * Automatically localises the href based on the current language.
 */
export const Link = createLink(getLanguage)
