import { describe, expect, it } from "vitest";
import { Bundle } from "../ast/index.js";
import { query } from "./index.js";

const mockBundle: Bundle = {
	type: "Bundle",
	id: { type: "Identifier", name: "mock" },
	resources: [
		{
			type: "Resource",
			body: [
				{
					type: "Message",
					id: { type: "Identifier", name: "first-message" },
					pattern: {
						type: "Pattern",
						elements: [{ type: "Text", value: "Welcome to this app." }],
					},
				},
			],
		},
	],
};

describe("query.get", () => {
	it("should return the message if the message exists", () => {
		const result = query(mockBundle).get({ id: "first-message" });
		expect(result?.id.name).toBe("first-message");
	});
	it("should return undefined if the message does not exist", () => {
		const result = query(mockBundle).get({ id: "none-existent-message" });
		expect(result).toBeUndefined();
	});
});
