import { NextRequest } from "next/server"

export interface RoutingStragey<T extends string> {
	getLocalisedPath(canonicalPath: string, locale: T): string
	getCanonicalPath(localisedPath: string, locale: T): string
	resolveLanguage(request: NextRequest): T | undefined
	translatePath(localisedPath: string, currentLocale: T, newLocale: T): string
}
