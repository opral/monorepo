import { expect, test } from "vitest";
import { newProject } from "./newProject.js";
import { loadProjectInMemory } from "./loadProjectInMemory.js";
import { selectBundleNested } from "../query-utilities/selectBundleNested.js";

test("roundtrip should succeed", async () => {
	const file1 = await newProject();
	const project1 = await loadProjectInMemory({ blob: file1 });
	const numBundles1 = (
		await project1.db.selectFrom("bundle").select("id").execute()
	).length;
	expect(numBundles1).toBe(0);

	// modify project
	const insertedBundle = await project1.db
		.insertInto("bundle")
		.values({
			id: "mock245",
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	const file1AfterUpdates = await project1.toBlob();
	await project1.close();

	const project2 = await loadProjectInMemory({ blob: file1AfterUpdates });
	const bundles = await project2.db.selectFrom("bundle").select("id").execute();
	expect(bundles.length).toBe(1);
	expect(bundles[0]?.id).toBe(insertedBundle.id);
});

test("selectBundleNested returns newly inserted bundles with variants", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	await project.db.insertInto("bundle").values({ id: "greeting" }).execute();
	const insertedMessage = await project.db
		.insertInto("message")
		.values({ bundleId: "greeting", locale: "en" })
		.returning("id")
		.executeTakeFirstOrThrow();

	await project.db
		.insertInto("variant")
		.values({
			messageId: insertedMessage.id,
			matches: [],
			pattern: [{ type: "text", value: "Hello world" }],
		})
		.execute();

	const bundles = await selectBundleNested(project.db).execute();
	expect(bundles).toHaveLength(1);
	const [bundle] = bundles;
	expect(bundle).toBeDefined();

	const resolvedBundle = bundle!;
	expect(resolvedBundle.id).toBe("greeting");

	const enMessage = resolvedBundle.messages.find(
		(message) => message.locale === "en"
	);
	expect(enMessage).toBeDefined();
	const textNode = enMessage?.variants[0]?.pattern[0] as
		| { type: string; value: string }
		| undefined;
	expect(textNode?.type).toBe("text");
	expect(textNode?.value).toBe("Hello world");
});
