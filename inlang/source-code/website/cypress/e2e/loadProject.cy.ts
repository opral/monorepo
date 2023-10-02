describe("editor", () => {
	it("should load inlang project in editor", () => {
		cy.visit(`${Cypress.config("baseUrl")}/editor`)
		cy.get("input").type("https://github.com/inlang/example")
		cy.get("form").contains("button", "Open").click()
		cy.url().should("include", "/github.com/inlang/example")
		cy.get("div#messageList", { timeout: 10_000 }).should("be.visible")
	})
})
