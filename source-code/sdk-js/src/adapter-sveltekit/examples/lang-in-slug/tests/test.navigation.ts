import { expect, test, type Page } from "@playwright/test"
import { baseURL } from "./index.js"

const ms = 100 // milliseconds to wait for client side routing

const checkHeadline = async (page: Page, text: string) => {
	await page.waitForTimeout(ms)
	await expect(page.locator("h1")).toBeVisible()
	const h1 = await page.locator("h1").textContent()
	expect(h1).toContain(text)
}

test("Navigation between About and Home with language switching", async ({ page }) => {
	// Navigate to the English About page
	await page.goto(`${baseURL}/en/about`)
	expect(page.url()).toBe(`${baseURL}/en/about`)

	// Check switching
	await page.click('button:text("de")')
	await page.click('button:text("en")')

	await checkHeadline(page, "About page en")
	await page.click('button:text("de")')
	await checkHeadline(page, "About page de")

	// Switch to the English language
	await page.click('button:text("en")')

	// Navigate to the English About page
	await page.click('a[href="/en/about"]')
	await checkHeadline(page, "About page en")
	expect(page.url()).toBe(`${baseURL}/en/about`)

	// Switch to the German language
	await page.click('button:text("de")')
	await checkHeadline(page, "About page de")
	expect(page.url()).toBe(`${baseURL}/de/about`)

	// Navigate to the German Home page
	await page.click('a[href="/de"]')
	await page.waitForTimeout(ms)
	expect(page.url()).toBe(`${baseURL}/de`)
	await checkHeadline(page, "Willkommen bei SvelteKit")

	// Switch to the English language
	await page.click('button:text("en")')
	await checkHeadline(page, "Welcome to SvelteKit")
	expect(page.url()).toBe(`${baseURL}/en`)

	// Navigate to the English Home page
	await page.click('a[href="/en"]')
	await page.waitForTimeout(ms)
	expect(page.url()).toBe(`${baseURL}/en`)
	await checkHeadline(page, "Welcome to SvelteKit")
})
