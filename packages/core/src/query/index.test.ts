import { describe, expect, it } from "vitest";
import type { Bundle, Message } from "../ast/index.js";
import { query } from "./index.js";

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

describe("query.delete", () => {
	it("should return a bundle without the deleted message if the message existed", () => {
		const result = query(mockBundle).delete({ id: "first-message" });
		if (result.isErr) {
			throw result.error;
		}
		expect(result.value.type).toBe("Bundle");
		const message = query(result.value).get({ id: "first-message" });
		expect(message).toBeUndefined();
	});
	it("should be immutable", () => {
		const result = query(mockBundle).delete({ id: "first-message" }).unwrap();
		const message = query(mockBundle).get({ id: "first-message" });
		expect(message).toBeDefined();
	});
	it("should return an error if the message did not exist", () => {
		const result = query(mockBundle).delete({ id: "none-existent-message" });
		expect(result.isErr).toBe(true);
	});
	it("should delete the message in the correct resource", () => {
		const bundle = query(mockBundle).delete({ id: "second-message" }).unwrap();
	});
});

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
		{
			type: "Resource",
			body: [
				{
					type: "Message",
					id: { type: "Identifier", name: "second-message" },
					pattern: {
						type: "Pattern",
						elements: [
							{ type: "Text", value: "You opened the app, congrats!" },
						],
					},
				},
			],
		},
	],
};
