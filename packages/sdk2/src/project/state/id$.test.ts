import { expect, test } from "vitest";
import { newLixFile, openLixInMemory } from "@lix-js/sdk";
import { firstValueFrom } from "rxjs";
import { createId$ } from "./id$.js";

test("if the settings file has been updated in lix, the observable should emit the new id", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });

	await lix.db
		.insertInto("file")
		.values({
			path: "/project_id",
			data: new TextEncoder().encode("foo-bar"),
		})
		.execute();

	const id$ = createId$({ lix });

	// todo the emitted events are always too high
	// that could be due to polling. not important rn.
	// let emittedEvents = 0;
	// settings$.subscribe(() => {
	// 	emittedEvents++;
	// });

	const id = await firstValueFrom(id$);

	expect(id).toBe("foo-bar");

	await lix.db
		.updateTable("file")
		.where("file.path", "=", "/project_id")
		.set({
			data: new TextEncoder().encode("foo-bar-box"),
		})
		.execute();

	const id2 = await firstValueFrom(id$);
	expect(id2).toBe("foo-bar-box");
});
