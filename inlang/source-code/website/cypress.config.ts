import { defineConfig } from "cypress"
import "cypress"

export default defineConfig({
	e2e: {
		baseUrl: "http://localhost:3000",
	},
})
