import React from "react"
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import {
	availableLanguageTags,
	languageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "$paraglide/runtime.js"
import { createLink } from "./Link"
import { prefixStrategy } from "./routing/prefix"

const Link = createLink(
	languageTag,
	prefixStrategy({
		availableLanguageTags,
		defaultLanguage: sourceLanguageTag,
		exclude: () => false,
	})
)

describe("<Link>", () => {
	beforeEach(() => {
		//known starting state
		setLanguageTag(sourceLanguageTag)
		process.env.__NEXT_ROUTER_BASE_PATH = ""
	})
	afterEach(() => cleanup())

	it("renders a link with the correct localised href", () => {
		render(
			<>
				<Link href="/about" locale="de" data-testid="german-link" />
				<Link href="/about" locale="en" data-testid="english-link" />
			</>
		)
		expect(screen.getByTestId("english-link").getAttribute("href")).toEqual("/about")
		expect(screen.getByTestId("german-link").getAttribute("href")).toEqual("/de/about")
	})

	it("renders a link with the current language if no locale is provided", () => {
		setLanguageTag("de")
		render(<Link href="/about" data-testid="german-link" />)
		expect(screen.getByTestId("german-link").getAttribute("href")).toEqual("/de/about")

		setLanguageTag("en")
		render(<Link href="/about" data-testid="english-link" />)
		expect(screen.getByTestId("english-link").getAttribute("href")).toEqual("/about")
	})
})
