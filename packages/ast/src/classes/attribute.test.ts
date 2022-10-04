import { Attribute } from "./attribute";
import { describe, it, expect } from "vitest";

describe("from()", () => {
	it("should return a new Attribute", () => {
		const attribute = Attribute.from({
			id: "the-attribute",
			value: "this is my test",
		}).unwrap();
		expect(attribute.id.name).toBe("the-attribute");
	});

	it("should fail if a malformatted pattern is provided", () => {
		const result = Attribute.from({
			id: "the-Attribute",
			value: "iangoithis is ${ my test",
		});
		expect(result.isErr).toBe(true);
	});
});
