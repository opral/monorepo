import { expect, test, vi } from "vitest";
import nodeFs from "node:fs";
import nodeOs from "node:os";
import nodePath from "node:path";
import {
	loadProjectFromDirectory,
	saveProjectToDirectory,
	type InlangPlugin,
} from "@inlang/sdk";
import { plugin } from "../plugin.js";

// loading and saving projects with the SDK is slow on CI
vi.setConfig({ testTimeout: 30_000 });

// What a project has after it loaded files with keys that look like they have
// suffixes (see keySuffixes.test.ts), and that saving it writes the files as
// they were. Kept apart from keySuffixes.test.ts, which imports the
// import-export modules before ../plugin.js (see namespace-write-back.test.ts).

async function load(text: string) {
	const dir = nodeFs.mkdtempSync(
		nodePath.join(nodeOs.tmpdir(), "i18next-key-suffixes-")
	);
	nodeFs.writeFileSync(nodePath.join(dir, "en.json"), text);
	nodeFs.mkdirSync(nodePath.join(dir, "project.inlang"));
	nodeFs.writeFileSync(
		nodePath.join(dir, "project.inlang/settings.json"),
		JSON.stringify({
			baseLocale: "en",
			locales: ["en"],
			"plugin.inlang.i18next": { pathPattern: "./{locale}.json" },
		})
	);
	const project = await loadProjectFromDirectory({
		path: nodePath.join(dir, "project.inlang"),
		fs: nodeFs,
		providePlugins: [plugin as unknown as InlangPlugin],
	});
	return {
		project,
		/** the bundle ids, the number of messages and the texts of the variants */
		async rows() {
			const texts = (
				await project.db.selectFrom("inlang_variant").selectAll().execute()
			).flatMap((variant) =>
				variant.pattern.map((part) => (part.type === "text" ? part.value : ""))
			);
			return {
				bundles: (
					await project.db.selectFrom("inlang_bundle").selectAll().execute()
				)
					.map((bundle) => bundle.id)
					.sort(),
				messages: (
					await project.db.selectFrom("inlang_message").selectAll().execute()
				).length,
				texts: texts.sort(),
			};
		},
		/** replaces the text `from` of a variant */
		async edit(from: string, to: string) {
			const variants = await project.db
				.selectFrom("inlang_variant")
				.selectAll()
				.execute();
			const variant = variants.find((variant) =>
				variant.pattern.some(
					(part) => part.type === "text" && part.value === from
				)
			)!;
			await project.db
				.updateTable("inlang_variant")
				.set({ pattern: [{ type: "text", value: to }] })
				.where("id", "=", variant.id)
				.executeTakeFirstOrThrow();
		},
		async save() {
			await saveProjectToDirectory({
				project,
				path: nodePath.join(dir, "project.inlang"),
				fs: nodeFs,
			});
			return nodeFs.readFileSync(nodePath.join(dir, "en.json"), "utf-8");
		},
	};
}

test("the keys of a group named like a suffixed key are messages of their own", async () => {
	const text = `{
  "q_frame": {
    "b": "y",
    "a": "x"
  }
}
`;
	const { project, rows, edit, save } = await load(text);
	try {
		expect(await rows()).toStrictEqual({
			bundles: ["q_frame.a", "q_frame.b"],
			messages: 2,
			texts: ["x", "y"],
		});
		expect(await save()).toBe(text);
		await edit("y", "z");
		expect(await save()).toBe(text.replace('"y"', '"z"'));
	} finally {
		await project.close();
	}
});

test("a key next to its context suffix is one message with both texts", async () => {
	const text = `{
  "checkout": {
    "shipping_free": "Free shipping",
    "shipping": "Shipping"
  },
  "checkout.total": "Total"
}
`;
	const { project, rows, edit, save } = await load(text);
	try {
		expect(await rows()).toStrictEqual({
			bundles: ["checkout.shipping", "checkout.total"],
			messages: 2,
			texts: ["Free shipping", "Shipping", "Total"],
		});
		expect(await save()).toBe(text);
		await edit("Free shipping", "Shipping is free");
		expect(await save()).toBe(
			text.replace("Free shipping", "Shipping is free")
		);
	} finally {
		await project.close();
	}
});
