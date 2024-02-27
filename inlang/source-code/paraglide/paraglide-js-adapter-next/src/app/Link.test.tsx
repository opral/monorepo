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

describe("<Link>", () => {
	beforeEach(() => {
		//known starting state
		setLanguageTag(sourceLanguageTag)
		process.env.__NEXT_ROUTER_BASE_PATH = ""
	})
	afterEach(() => cleanup())

	it("renders a link with the correct localised href", () => {
		const Link = createLink(
			languageTag,
			prefixStrategy({
				availableLanguageTags,
				defaultLanguage: sourceLanguageTag,
				pathnames: {},
				exclude: () => false,
			})
		)

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
		const Link = createLink(
			() => languageTag(), //For some reason we can't pass languageTag as a reference directly
			prefixStrategy({
				availableLanguageTags,
				defaultLanguage: sourceLanguageTag,
				pathnames: {},
				exclude: () => false,
			})
		)

		setLanguageTag("de")
		render(
			<Link href="/about" data-testid="german-link">
				{languageTag()}
			</Link>
		)
		expect(screen.getByTestId("german-link").getAttribute("href")).toEqual("/de/about")

		setLanguageTag("en")
		render(<Link href="/about" data-testid="english-link" />)
		expect(screen.getByTestId("english-link").getAttribute("href")).toEqual("/about")
	})

	it("renders a link with searchParams", () => {
		const Link = createLink(
			() => languageTag(), //For some reason we can't pass languageTag as a reference directly
			prefixStrategy({
				availableLanguageTags,
				defaultLanguage: sourceLanguageTag,
				pathnames: {},
				exclude: () => false,
			})
		)

		setLanguageTag("de")
		render(
			<Link href="/about?param=1" data-testid="german-link">
				{languageTag()}
			</Link>
		)
		expect(screen.getByTestId("german-link").getAttribute("href")).toEqual("/de/about?param=1")

		setLanguageTag("en")
		render(<Link href="/about?param=1" data-testid="english-link" />)
		expect(screen.getByTestId("english-link").getAttribute("href")).toEqual("/about?param=1")
	})

	it("localises hrefs with path translations and searchParams", () => {
		const Link = createLink(
			() => languageTag(), //For some reason we can't pass languageTag as a reference directly
			prefixStrategy({
				availableLanguageTags,
				defaultLanguage: sourceLanguageTag,
				pathnames: {
					"/about": {
						de: "/ueber-uns",
						en: "/about",
					},
				},
				exclude: () => false,
			})
		)

		setLanguageTag("de")
		render(
			<Link href="/about?params=1" data-testid="german-link">
				{languageTag()}
			</Link>
		)
		expect(screen.getByTestId("german-link").getAttribute("href")).toEqual("/de/ueber-uns?params=1")

		setLanguageTag("en")
		render(<Link href="/about?param=1" data-testid="english-link" />)
		expect(screen.getByTestId("english-link").getAttribute("href")).toEqual("/about?param=1")
	})


})
