import express, { Router } from "express"
import { URL } from "node:url"
import path from "node:path"

/** the root path of the server (manage/) */
const rootPath = new URL("../..", import.meta.url).pathname

export const router: Router = express.Router()

// Serve static files from the "dist" directory (adjust the path accordingly)
router.use(express.static(path.join(rootPath, "dist")))

// Route all requests to the SPA's HTML file
router.get("*", (req, res) => {
	res.sendFile(path.join(rootPath, "dist", "index.html"))
})
