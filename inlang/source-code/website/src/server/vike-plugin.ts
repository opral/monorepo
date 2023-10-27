import express, { Router } from "express"
import { renderPage } from "vike/server"

export const router: Router = express.Router()

// serving #src/pages and /public
//! it is extremely important that a request handler is not async to catch errors
//! express does not catch async errors. hence, renderPage uses the callback pattern
router.get("*", (request, response, next) => {
	renderPage({
		urlOriginal: request.originalUrl,
	})
		.then((pageContext) => {
			if (pageContext.httpResponse === null) {
				next()
			} else {
				const { body, headers, statusCode } = pageContext.httpResponse
				for (const [name, value] of headers) response.setHeader(name, value)
				response.status(statusCode).send(body)
			}
		})
		// pass the error to expresses error handling
		.catch(next)
})
