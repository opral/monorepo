import express, { Router, type Request, type Response } from "express"
import { Resvg } from "@resvg/resvg-js"
import { badge } from "./badge.js"

// Create the express router
export const router: Router = express.Router()

// Route for the /badge endpoint
router.get(
	"/",
	async (
		req: Request<object, object, object, { url?: string; project?: string; size?: string }>,
		res: Response
	) => {
		try {
			// Get the url from the query
			const { url, project } = req.query
			if (!url) {
				res.send(
					"No url provided, please provide a url like this: https://badge.inlang.com/?url=github.com/opral/example"
				)
				return
			}
			const image = await badge(url, project)

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
	}
)
