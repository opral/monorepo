import { test, expect } from "@playwright/test"

test("Check if badge endpoint returns true for the inlang badge", async ({ page }) => {
	// Listen for the response event to capture the status code
	const [response] = await Promise.all([
		page.waitForResponse(
			(response) => response.url() === "http://localhost:3000/badge?url=github.com/inlang/monorepo"
		),
		page.goto("http://localhost:3000/badge?url=github.com/inlang/monorepo"),
	])

	// Get the status code from the response
	const status = response.status()

	// Assert that the status code is 200
	expect(status).toBe(200)
})
