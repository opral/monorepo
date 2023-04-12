import express, { Request, Response } from "express"
import { Resvg } from "@resvg/resvg-js"
import { badge } from "./badge.js"

interface TranslationData {
	[language: string]: number
}

interface ChartData {
	labels: string[]
	datasets: {
		label: string
		data: number[]
		backgroundColor: string
	}[]
}

// Function to generate the chart using Chart.js
const generateChart = (data: TranslationData): string => {
	const chartData: ChartData = {
		labels: Object.keys(data),
		datasets: [
			{
				label: "Translation Progress",
				data: Object.values(data),
				backgroundColor: "rgba(16, 185, 129, 0.7)",
			},
		],
	}

	// Chart.js code here...
	// Return the chart as a base64 encoded string
	return "base64-encoded-chart-string"
}

// Create the express router
export const router = express.Router()

// Route for the /badge endpoint
router.get(
	"/badge",
	async (req: Request<object, object, object, { url?: string; size?: string }>, res: Response) => {
		try {
			const { url, size } = req.query
			if (!url) {
				res.send(
					"No url provided, please provide a url like this: https://inlang.com/badge?url=github.com/inlang/example",
				)
				return
			}
			const image = await badge(url)

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
