/**
 * ------------------------------------
 * This middelware aims to redirect old Urls to new ones
 *
 * You can use it by adding the old and the new url in the
 * Object as key and value.
 * ------------------------------------
 */

import type { NextFunction, Request, Response } from "express"

const redirectMap: { [key: string]: string } = {
	"/documentation/getting-started": "/documentation/quick-start",
}

export async function redirects(request: Request, response: Response, next: NextFunction) {
	try {
		//redirect
		if (Object.keys(redirectMap).includes(request.url)) {
			const redirectUrl: string = redirectMap[request.url]
				? redirectMap[request.url]!
				: request.url!
			response.redirect(redirectUrl)
		}
		next()
	} catch (error) {
		next(error)
	}
}
