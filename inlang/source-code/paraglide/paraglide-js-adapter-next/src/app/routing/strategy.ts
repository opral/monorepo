import { LinkProps } from "next/link"
import { NextRequest } from "next/server"

export interface RoutingStragey<T extends string> {
	getLocalisedPath(canonicalPath: string, locale: T): string
	getCanonicalPath(localisedPath: string): string
	resolveLanguage(request: NextRequest): T

	translatePath(localisedPath: string, newLocale: T): string

	localiseHref<P extends LinkProps["href"]>(canonicalHref: P, lang: T): P
	defaultLanguage: T
}
