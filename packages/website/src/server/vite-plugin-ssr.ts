import express from "express"
import { renderPage } from "vite-plugin-ssr/server"

export const router = express.Router()

// serving @src/pages and /public
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
				const { body, statusCode, contentType } = pageContext.httpResponse
				response.status(statusCode).type(contentType).send(body)
			}
		})
		// pass the error to expresses error handling
		.catch(next)
})
