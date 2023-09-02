import express, { Router, type Request, type Response } from "express"
import { MarketplaceSchema } from "./interface.js"

// Create the express router
export const router: Router = express.Router()

// Route for the /marketplace-schema endpoint (req is required for fulfilling the request)
router.get("/marketplace-manifest-schema.json", async (req: Request, res: Response) => {
	try {
		res.header("Content-Type", "text/xml")
		res.send(MarketplaceSchema)
	} catch (error) {
		console.error(error)
		res.status(500).send("Error returning marketplace schema")
	}
})
