import { test, expect } from "@playwright/test"

test("Check if badge endpoint returns true for the inlang badge", async ({ page }) => {
	// Listen for the response event to capture the status code
	const [response] = await Promise.all([
		page.waitForResponse(
			(response) => response.url() === "http://localhost:3000/badge?url=github.com/opral/monorepo"
		),
		page.goto("/badge?url=github.com/opral/monorepo"),
	])

	// Get the status code from the response
	const status = response.status()

	// Assert that the status code is 200
	expect(status).toBe(200)
})
