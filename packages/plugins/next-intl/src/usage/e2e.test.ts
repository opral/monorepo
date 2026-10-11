import fs from "node:fs";
import os from "node:os";
import nodePath from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, expect, test, vi } from "vitest";
import {
	applyFix,
	checkProject,
	findUsages,
	loadProjectFromDirectory,
	type InlangPlugin,
	type InlangProject,
	type SourceFile,
} from "@inlang/sdk";
import { plugin } from "../plugin.js";

// loading projects with the SDK is slow on CI
vi.setConfig({ testTimeout: 30_000 });

const fixtures = fileURLToPath(
	new URL("../../fixtures/usage", import.meta.url)
);
const open: InlangProject[] = [];
afterEach(async () => {
	for (const project of open.splice(0)) await project.close();
});

/** Loads a copy of a fixture app like the CLI does: the project and its source files. */
async function load(name: string) {
	const root = fs.mkdtempSync(nodePath.join(os.tmpdir(), "next-intl-usage-"));
	fs.cpSync(nodePath.join(fixtures, name), root, { recursive: true });
	const project = await loadProjectFromDirectory({
		path: nodePath.join(root, "project.inlang"),
		fs,
		providePlugins: [plugin as unknown as InlangPlugin],
	});
	open.push(project);
	const files: SourceFile[] = [];
	const walk = (directory: string) => {
		for (const entry of fs.readdirSync(nodePath.join(root, directory), {
			withFileTypes: true,
		})) {
			const path = `${directory}/${entry.name}`;
			if (entry.isDirectory()) walk(path);
			else
				files.push({
					path,
					content: fs.readFileSync(nodePath.join(root, path), "utf8"),
				});
		}
	};
	walk("src");
	return { project, files };
}
const unused = (result: Awaited<ReturnType<typeof checkProject>>) =>
	result.diagnostics
		.filter((diagnostic) => diagnostic.checkId === "unused-message")
		.map((diagnostic) => diagnostic.bundleId)
		.sort();

test("an App Router app: unused messages are found, used ones have references", async () => {
	const { project, files } = await load("app-router");
	expect(await project.errors.get()).toEqual([]);
	const result = await checkProject({
		project,
		files,
		checks: ["unused-message"],
	});
	expect(result.checks).toEqual([{ id: "unused-message", status: "complete" }]);
	expect(unused(result)).toEqual([
		"Checkout.Summary.removed",
		"Home.unused",
		"Nav.contact",
		"Status.closed",
		"Status.open",
	]);

	const usages = await findUsages({ project, files });
	expect(usages.status).toBe("complete");
	const byBundle = new Map<string, string[]>();
	for (const reference of usages.references)
		byBundle.set(reference.bundleId, [
			...(byBundle.get(reference.bundleId) ?? []),
			`${reference.path}:${reference.start.line}`,
		]);
	expect(Object.fromEntries([...byBundle].sort())).toEqual({
		"About.body": ["src/content/about.mdx:10"],
		"About.title": ["src/content/about.mdx:5"],
		"Checkout.Summary.shipping": ["src/components/Summary.tsx:8"],
		"Checkout.Summary.title": ["src/components/Summary.tsx:7"],
		"Home.cart": [
			"src/app/[locale]/ClientPart.tsx:8",
			"src/app/[locale]/ClientPart.tsx:9",
			"src/app/[locale]/ClientPart.tsx:10",
		],
		"Home.description": ["src/app/[locale]/page.tsx:26"],
		"Home.terms": ["src/app/[locale]/page.tsx:27"],
		"Home.title": ["src/app/[locale]/page.tsx:25"],
		"Metadata.description": ["src/app/[locale]/page.tsx:12"],
		"Metadata.title": ["src/app/[locale]/page.tsx:12"],
		"Nav.about": ["src/components/Nav.tsx:17"],
		"Nav.home": ["src/components/Nav.tsx:14", "src/components/Nav.tsx:17"],
	});

	// The fix deletes an unused message from every locale.
	const diagnostic = result.diagnostics.find(
		(d) => d.bundleId === "Home.unused"
	)!;
	expect(
		await applyFix({
			project,
			files,
			diagnostic,
			fixId: "delete-unused-message",
		})
	).toEqual({ status: "applied", affectedBundleIds: ["Home.unused"] });
	expect(
		await project.db
			.selectFrom("inlang_bundle")
			.where("id", "=", "Home.unused")
			.selectAll()
			.execute()
	).toEqual([]);
});

test("a dynamic key withholds every unused finding and points at the key", async () => {
	const { project, files } = await load("app-router");
	const status = {
		path: "src/components/Status.tsx",
		content: `"use client";
import { useTranslations } from "next-intl";

export function Status({ state }: { state: "open" | "closed" }) {
  const t = useTranslations("Status");
  return <span>{t(\`\${state}\`)}</span>;
}
`,
	};
	const result = await checkProject({
		project,
		files: [...files, status],
		checks: ["unused-message"],
	});
	expect(unused(result)).toEqual([]);
	expect(result.checks).toEqual([
		{
			id: "unused-message",
			status: "incomplete",
			reason:
				"Some usages could not be analyzed. Unused diagnostics and fixes are withheld.",
			issues: [
				{
					path: "src/components/Status.tsx",
					reason: "A dynamic message key can't be resolved statically.",
					start: { line: 6, column: 18 },
					end: { line: 6, column: 28 },
				},
			],
		},
	]);
	// the fix revalidates and refuses as well
	const complete = await checkProject({
		project,
		files,
		checks: ["unused-message"],
	});
	const diagnostic = complete.diagnostics.find(
		(d) => d.bundleId === "Status.open"
	)!;
	expect(
		await applyFix({
			project,
			files: [...files, status],
			diagnostic,
			fixId: "delete-unused-message",
		})
	).toEqual({
		status: "skipped",
		reason: expect.stringContaining("Some usages could not be analyzed"),
	});
});

test("the real next-intl app of the e2e tests: t.has with a dynamic key and t.raw of a namespace are located", async () => {
	const { project, files } = await load("next-intl-e2e");
	expect(await project.errors.get()).toEqual([]);
	const result = await checkProject({
		project,
		files,
		checks: ["unused-message"],
	});
	expect(unused(result)).toEqual([]);
	const check = result.checks[0]!;
	expect(check.status).toBe("incomplete");
	expect(
		check.issues!.map(
			(issue) => `${issue.path}:${issue.start?.line} ${issue.reason}`
		)
	).toEqual([
		"src/app/[locale]/page.tsx:16 A dynamic message key can't be resolved statically.",
		`src/app/[locale]/page.tsx:63 t.has() can read a whole namespace; the messages under "Nav.links" can't be resolved.`,
		`src/app/[locale]/page.tsx:63 t.raw() can read a whole namespace; the messages under "Nav.links" can't be resolved.`,
		`src/app/[locale]/page.tsx:79 t.has() can read a whole namespace; the messages under "Legacy" can't be resolved.`,
		`src/app/[locale]/page.tsx:80 t.raw() can read a whole namespace; the messages under "Legacy" can't be resolved.`,
	]);
	// `Legacy.key.with.dots` is only read through t.raw("Legacy"): it must not be reported unused
	const usages = await findUsages({ project, files });
	expect(usages.status).toBe("incomplete");
	expect(
		new Set(usages.references.map((reference) => reference.bundleId))
	).toEqual(
		new Set([
			"Home.title",
			"Home.description",
			"Home.cart",
			"Home.unread",
			"Home.liked",
			"Home.invites",
			"Home.place",
			"Home.terms",
			"Home.price",
			"Home.updated",
			"Home.escaped",
			"Home.apostrophe",
			"Nav.home",
			"Nav.about",
			"Nav.links",
			"Checkout.Summary.title",
			"Checkout.Summary.shipping",
			"Checkout.Summary.total",
			"Legacy",
		])
	);
});
