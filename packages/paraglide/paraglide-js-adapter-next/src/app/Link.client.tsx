import { createLink } from "./Link.base"
import { getLanguage } from "./getLanguage.client"

export const Link = createLink(getLanguage)
