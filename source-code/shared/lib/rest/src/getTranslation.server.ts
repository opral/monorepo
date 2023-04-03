import express from "express"
import { ENDPOINT } from "./getTranslation.js"
import bodyParser from "body-parser"
import dotenv from "dotenv"

export const getTranslateRoute = express.Router()
getTranslateRoute.use(bodyParser.json({ limit: "50mb" }))

getTranslateRoute.post(ENDPOINT, async (req, res) => {
	try {
		dotenv.config()
		const response = await fetch(
			"https://translation.googleapis.com/language/translate/v2?" +
				new URLSearchParams({
					q: req.body.text,
					target: req.body.targetLanguage,
					source: req.body.referenceLanguage,
					format: "text",
					key: process.env.GOOGLE_TRANSLATE_API_KEY!,
				}),
			{ method: "POST" },
		)
		const json = await response.json()
		if (response.ok) {
			res.send({ data: json.data.translations[0].translatedText })
		}
		throw Error(json)
	} catch (error) {
		res.status(500)
		res.send()
	}
})
