import { describe, it, expect } from "vitest"
import { CookieConfig, serializeCookie } from "./cookie"

describe("serializeCookie", () => {
	it("serializes a cookie", () => {
		const cookieConfig: CookieConfig = {
			name: "foo",
			value: "bar",
			maxAge: 60,
			httpOnly: true,
			path: "/",
			sameSite: "strict",
		}
		expect(serializeCookie(cookieConfig)).toBe(
			"foo=bar; Max-Age=60; HttpOnly; Path=/; SameSite=strict"
		)
	})
})
