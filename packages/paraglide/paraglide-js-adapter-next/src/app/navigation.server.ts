import { createNavigation } from "./navigation.base"
import { getLanguage } from "./getLanguage.server"

export const { useRouter, redirect, permanentRedirect } = createNavigation(getLanguage)
