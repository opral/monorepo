import { expect, test, type Page } from "@playwright/test"
import { baseURL } from "./index.js"

const checkHeadline = async (page: Page, text: string) => {
	await expect(page.locator("h1")).toBeVisible()
	const h1 = await page.locator("h1").textContent()
	expect(h1).toContain(text)
}

test("Localized website", async ({ page }) => {
	await page.goto(`${baseURL}/en/about`)
	expect(page.url()).toBe(`${baseURL}/en/about`)

	await page.goto(`${baseURL}/de/about`)
	expect(page.url()).toBe(`${baseURL}/de/about`)

	const logs: any = []
	page.on("console", (msg) => logs.push(msg.text()))

	// Go to english page
	await page.goto(`${baseURL}/en/about`)
	expect(page.url()).toBe(`${baseURL}/en/about`)
	await page.evaluate(() => console.log("English About page loaded"))

	/* Check the headline */
	await checkHeadline(page, "About page en")

	// Go to german page
	await page.goto(`${baseURL}/de/about`)
	expect(page.url()).toBe(`${baseURL}/de/about`)
	await page.evaluate(() => console.log("German About page loaded"))

	/* Check the headline */
	await checkHeadline(page, "About page de")

	expect(logs).toContain("English About page loaded")
	expect(logs).toContain("German About page loaded")
})
