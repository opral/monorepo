// import { expect, test, type Page } from "@playwright/test"
// import { baseURL } from "./index.js"

// const checkHeadline = async (page: Page, text: string) => {
// 	await expect(page.locator("h1")).toBeVisible()
// 	const h1 = await page.locator("h1").textContent()
// 	expect(h1).toContain(text)
// }

// test("Navigation between About and Home with language switching", async ({ page }) => {
// 	// Navigate to the English About page
// 	await page.goto(`${baseURL}/en/about`)
// 	expect(page.url()).toBe(`${baseURL}/en/about`)

// 	// Switch to the German language
// 	await page.click('button:has-text("de")')
// 	await page.waitForSelector('h1:has-text("About page de")')
// 	checkHeadline(page, "About page de")

// 	// Navigate to the German Home page
// 	await page.click('a[href="/de"]')
// 	expect(page.url()).toBe(`${baseURL}/de`)

// 	// Switch to the English language
// 	await page.click('button:has-text("en")')
// 	await page.waitForSelector('h1:has-text("Welcome to SvelteKit")')
// 	expect(page.url()).toBe(`${baseURL}/en`)

// 	// Navigate to the English About page
// 	await page.click('a[href="/en/about"]')
// 	expect(page.url()).toBe(`${baseURL}/en/about`)

// 	// Check the headlines
// 	await checkHeadline(page, "About page en")

// 	// Switch to the German language
// 	await page.click('button:has-text("de")')
// 	await page.waitForSelector('h1:has-text("About page de")')
// 	expect(page.url()).toBe(`${baseURL}/de/about`)

// 	// Navigate to the German Home page
// 	await page.click('a[href="/de"]')
// 	expect(page.url()).toBe(`${baseURL}/de`)

// 	// Check the headlines
// 	await checkHeadline(page, "Willkommen bei SvelteKit")

// 	// Switch to the English language
// 	await page.click('button:has-text("en")')
// 	await page.waitForSelector('h1:has-text("Welcome to SvelteKit")')
// 	expect(page.url()).toBe(`${baseURL}/en`)

// 	// Navigate to the English Home page
// 	await page.click('a[href="/en"]')
// 	expect(page.url()).toBe(`${baseURL}/en`)

// 	// Check the headlines
// 	await checkHeadline(page, "Welcome to SvelteKit")
// })
