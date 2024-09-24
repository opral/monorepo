import { describe, test, expect } from "vitest";
import { app } from "./index";
import fs from "node:fs/promises";
import { newLixFile, openLixInMemory, merge } from "@lix-js/sdk";
import { plugin } from "./csv-plugin.js";

describe("hono app tes", () => {
	test("get /lix-file/:id non existing", async () => {
		const res = await app.request("/lix-file/i-dont-exist");
		expect(res.status).toBe(400);
	});

	test("post /lix-file/:id", async () => {
		const projectName = "new-one";
		const user1newLixProjectBlob = await newLixFile();
		const user1newProject = await openLixInMemory({
			blob: user1newLixProjectBlob,
			providePlugins: [plugin],
		});

		const demoCsv = await fs.readFile("./testdata/demo.csv", "utf-8");

		user1newProject.currentAuthor.set("Demo User1");
		await user1newProject.db
			.insertInto("file")
			.values([
				{
					id: "demo1",
					path: "/data.csv",
					data: await new Blob([demoCsv]).arrayBuffer(),
					metadata: {
						unique_column: "Stakeholder",
						demo: true,
					},
				},
			])
			.execute();

		const res = await app.request("/lix-file/" + projectName, {
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
			},
			body: await user1newProject.toBlob(),
		});

		const content = await res.arrayBuffer();

		const serverLix = await openLixInMemory({
			blob: new Blob([content]),
			providePlugins: [plugin],
		});

		const res2 = await app.request("/lix-file/" + projectName);
		const content2 = await res2.arrayBuffer();

		expect(new Blob([content])).toStrictEqual(new Blob([content2]));

		const user2Lix = await openLixInMemory({
			blob: new Blob([content]),
			providePlugins: [plugin],
		});
		user2Lix.currentAuthor.set("Demo User2");

		await user2Lix.db
			.insertInto("file")
			.values([
				{
					id: "demo2",
					path: "/data2.csv",
					data: await new Blob([demoCsv]).arrayBuffer(),
					metadata: {
						unique_column: "Stakeholder",
						demo: true,
					},
				},
			])
			.execute();

		const resUser2Push = await app.request("/lix-file/" + projectName, {
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
			},
			body: await user2Lix.toBlob(),
		});

		const resUser1Push = await app.request("/lix-file/" + projectName, {
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
			},
			body: await user1newProject.toBlob(),
		});

		await merge({
			sourceLix: await openLixInMemory({
				blob: new Blob([await resUser1Push.arrayBuffer()]),
				providePlugins: [plugin],
			}),
			targetLix: user1newProject,
		});

		const changes = await user1newProject.db
			.selectFrom("change")
			.selectAll()
			.where("change.file_id", "=", "demo1")
			.execute();
	});
});
