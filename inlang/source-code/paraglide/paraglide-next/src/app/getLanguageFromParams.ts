import { staticGenerationAsyncStorage } from "next/dist/client/components/static-generation-async-storage.external"
import { rsc } from "rsc-env"

export function illegalyGetLanguageFromParams() {
	const params = getParams()
	console.info("params", params)
}

const getParams = () => {
	if (!rsc) throw new Error("illegalyGetLanguageFromParams must be called in a server component")
	const store = staticGenerationAsyncStorage.getStore()

	if (!store) return {}

	const { urlPathname, pagePath = "/" } = store

	const cleanUrlPathname = normalizePathname(urlPathname)
	const cleanPagePath = normalizePagePath(pagePath)
	const pagePathParts = cleanPagePath.split("/")
	const pagePathInterceptedParts = normalizeInterceptingRoutes(pagePathParts)
	const pathnameParts = cleanUrlPathname.split("/")

	const isNotFoundPage = pagePath.match(/\/_not-found\/?$/)
	const isValidCatchALl =
		cleanPagePath.match(/\/\[\.\.\.[^\]]+\]/) &&
		pathnameParts.length >= pagePathInterceptedParts.length
	const isValidOptionalCatchALl =
		cleanPagePath.match(/\/\[\[\.\.\.[^\]]+\]\]/) &&
		pathnameParts.length >= pagePathInterceptedParts.length - 1
	const isCorrectMatched =
		isNotFoundPage ||
		pagePathInterceptedParts.length === pathnameParts.length ||
		isValidCatchALl ||
		isValidOptionalCatchALl

	if (!isCorrectMatched) {
		const createIssueUrl = new URL("https://github.com/vordgi/nimpl-getters/issues/new")
		createIssueUrl.searchParams.set("title", "Error parsing segments in get-params")
		createIssueUrl.searchParams.set(
			"body",
			`urlPathname: \`${urlPathname}\`;\n\npagePath: \`${pagePath}\`;`
		)
		createIssueUrl.searchParams.append("labels", "bug")
		throw new Error(`Something went wrong. Please create an issue on Github: ${createIssueUrl}`)
	}

	const query = parseSegments(pagePathInterceptedParts, pathnameParts)
	return query
}

export const normalizePathname = (pathname: string) => {
	const cleanPathname = pathname && new URL(pathname, "http://n").pathname
	const pathnameWithoutTrailingSlash = cleanPathname?.replace(/^(\/.*)\/$/, "$1")
	const pathnameWithoutFileType = pathnameWithoutTrailingSlash?.replace(/\/_not-found$/, "")
	return pathnameWithoutFileType || "/"
}

export const normalizePagePath = (pagePath: string) => {
	const cleanPagePath = pagePath && new URL(pagePath, "http://n").pathname
	const pagePathWithoutFileType = cleanPagePath?.replace(/(\/page|\/_not-found)$/, "")
	const pagePathWithoutGroups = pagePathWithoutFileType
		.split("/")
		.filter((segment) => !segment.match(/^(\([^)]+\)$|^@.+$)/g))

	return pagePathWithoutGroups.join("/") || "/"
}

export const parseSegments = (pagePathParts: string[], pathnameParts: string[]) => {
	const query = pagePathParts.reduce<{ [key: string]: string | string[] }>((acc, cur, index) => {
		const optionalCatchAllSegment = cur.match(/^\[\[\.\.\.([^\]]+)\]\]$/)
		if (optionalCatchAllSegment) {
			const key = optionalCatchAllSegment[1]
			const segmentParts = pathnameParts.slice(index)
			if (segmentParts.length) {
				acc[key] = segmentParts
			}
			return acc
		}

		const catchAllSegment = cur.match(/^\[\.\.\.([^\]]+)\]$/)
		if (catchAllSegment) {
			const key = catchAllSegment[1]
			acc[key] = pathnameParts.slice(index)
			return acc
		}

		const dynamicSegment = cur.match(/^\[([^\]]+)\]$/)
		if (dynamicSegment) {
			const key = dynamicSegment[1]
			acc[key] = pathnameParts[index]
			return acc
		}

		return acc
	}, {})

	return query
}

export const normalizeInterceptingRoutes = (pageParts: string[]) => {
	let skip = 0
	const normilizedParts: string[] = []

	for (const pagepart of [...pageParts].reverse()) {
		if (skip) {
			skip -= 1
			continue
		}

		if (pagepart.startsWith("(...)")) {
			normilizedParts.push(pagepart.replace(/^\(\.\.\.\)/, ""))
			break
		} else if (pagepart.startsWith("(.)")) {
			normilizedParts.push(pagepart.replace(/^\(\.\)/, ""))
		} else if (pagepart.startsWith("(..)")) {
			const skipLeafs = pagepart.match(/\(\.\.\)/g)
			skip += skipLeafs?.length || 0
			normilizedParts.push(pagepart.replace(/^(\(\.\.\))+/, ""))
		} else {
			normilizedParts.push(pagepart)
		}
	}

	return normilizedParts.reverse()
}
