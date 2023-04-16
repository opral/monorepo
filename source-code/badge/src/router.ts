import express, { Request, Response } from "express"
import { Resvg } from "@resvg/resvg-js"
import { badge } from "./badge.js"
import { getPreferredLanguage, parseAcceptLanguageHeader } from "./helper/lang.js"

// Create the express router
export const router = express.Router()

// Route for the /badge endpoint
router.get(
	"/badge",
	async (req: Request<object, object, object, { url?: string; size?: string }>, res: Response) => {
		try {
			let preferredLanguage: string | undefined

			const lang = req.headers["accept-language"]

			if (lang) {
				// parse the language
				const languagePriorities = parseAcceptLanguageHeader(lang)
				// get the preferred language
				preferredLanguage = getPreferredLanguage(languagePriorities)
			}

			// Get the url from the query
			const { url, size } = req.query
			if (!url) {
				res.send(
					"No url provided, please provide a url like this: https://inlang.com/badge?url=github.com/inlang/example",
				)
				return
			}
			const image = await badge(url, preferredLanguage)

			// render png
			const resvg = new Resvg(image)
			const pngData = resvg.render()
			const pngBuffer = pngData.asPng()

			// Send the png image
			res.header("Content-Type", "image/png")
			res.send(pngBuffer)
		} catch (error) {
			console.error(error)
			res.status(500).send("Error generating badge image")
		}
	},
)
