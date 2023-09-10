import { it, expect } from "vitest"
import { m } from "./runtime.js"

it("should return the correct message", () => {
	expect(m("loginButton", {})).toBe("Login")
	expect(m("logoutButton", {})).toBe("Logout")
	expect(m("greeting", { name: "John" })).toBe("Hello John!")
	expect(m("greetingWithCount", { name: "John", count: 5 })).toBe(
		"Hello John! You have 5 messages.",
	)
})
