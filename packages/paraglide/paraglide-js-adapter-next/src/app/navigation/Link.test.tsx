import React from "react"
import { expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import { Link } from "./Link"

test("<Link>", () => {
	render(<Link href="/about" locale="de" data-testid="link" />)
	expect(screen.getByTestId("link").getAttribute("href")).toEqual("/de/about")
})
