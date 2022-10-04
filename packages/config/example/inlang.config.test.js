import fs from "node:fs/promises";
import { expect, test } from "vitest";
import { config } from "./inlang.config.js";
import { Resource, Message } from "@inlang/ast";

test("tbd", async () => {
	const resource = await config.readResource({ fs, languageCode: "de" });
	expect(resource).toStrictEqual(
		new Resource([
			Message.from({
				id: "button",
				value: "Registrieren",
			}).unwrap(),
			Message.from({
				id: "header",
				value: "Dies ist eine Beispielresource.",
			}).unwrap(),
		])
	);
});
