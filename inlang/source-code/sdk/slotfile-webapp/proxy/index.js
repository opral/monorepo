#!/usr/bin/node

// eslint-disable-next-line no-undef, @typescript-eslint/no-var-requires
import express from "express"
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
import corsProxy from "@isomorphic-git/cors-proxy/middleware.js"

const app = express()
const options = {}

app.use(corsProxy(options))

app.listen(9998, () => {
	// eslint-disable-next-line no-undef
	console.log(`Server is running on port ${9998}`)
})
