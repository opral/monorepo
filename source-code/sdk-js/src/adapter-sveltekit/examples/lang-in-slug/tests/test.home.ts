import { expect, test, type Page } from "@playwright/test"
import { baseURL } from "./index.js"

const checkHeadline = async (page: Page, text: string) => {
	await expect(page.locator("h1")).toBeVisible()
	const h1 = await page.locator("h1").textContent()
	expect(h1).toContain(text)
}

test("Home page", async ({ page }) => {
	await page.goto(`${baseURL}/en`)
	expect(page.url()).toBe(`${baseURL}/en`)

	await page.goto(`${baseURL}/de`)
	expect(page.url()).toBe(`${baseURL}/de`)

	const logs: any = []
	page.on("console", (msg) => logs.push(msg.text()))

	// Go to english page
	await page.goto(`${baseURL}/en`)
	expect(page.url()).toBe(`${baseURL}/en`)
	await page.evaluate(() => console.info("English page loaded"))

	/* Check the headline */
	await checkHeadline(page, "Welcome to SvelteKit")

	// Go to german page
	await page.goto(`${baseURL}/de`)
	expect(page.url()).toBe(`${baseURL}/de`)
	await page.evaluate(() => console.info("German page loaded"))

	/* Check the headline */
	await checkHeadline(page, "Willkommen bei SvelteKit")

	expect(logs).toContain("English page loaded")
	expect(logs).toContain("German page loaded")
})
