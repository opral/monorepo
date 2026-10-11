/**
 * Usage analysis (`analyzeUsage`) of the plugins that have one, run by the
 * current SDK's `checkProject` and `findUsages` with the plugin module that
 * projects load from `settings.modules`: the bundled file jsdelivr serves.
 */
import { afterEach, expect, test } from "vitest";
import { checkProject, findUsages } from "@inlang/sdk";
import {
	type Project,
	encode,
	fetchedModules,
	loadFromBlob,
	newProjectBlob,
	plugins,
	servePlugins,
} from "./harness.js";

const opened: Project[] = [];
afterEach(async () => {
	for (const project of opened.splice(0)) await project.close();
});

const messages = {
	en: {
		Home: { title: "Welcome", unused: "Never shown" },
		Nav: { home: "Home" },
	},
	de: {
		Home: { title: "Willkommen", unused: "Nie gezeigt" },
		Nav: { home: "Start" },
	},
};
const files = [
	{
		path: "src/app/[locale]/page.tsx",
		content: `import { getTranslations } from "next-intl/server";
export default async function Page() {
	const t = await getTranslations("Home");
	return <h1>{t("title")}</h1>;
}`,
	},
	{
		path: "src/content/nav.mdx",
		content: `import { useTranslations } from "next-intl";

export function Home() {
  const t = useTranslations("Nav");
  return t("home");
}

<Home />
`,
	},
];

async function nextIntlProject(version: "published" | "current") {
	servePlugins(version);
	fetchedModules.length = 0;
	const url = plugins["plugin.inlang.nextIntl"].url;
	const project = await loadFromBlob(
		"current",
		await newProjectBlob("current", {
			baseLocale: "en",
			locales: ["en", "de"],
			modules: [url],
			"plugin.inlang.nextIntl": { pathPattern: "./messages/{locale}.json" },
		})
	);
	opened.push(project);
	expect(fetchedModules).toEqual([`${version} ${url}`]);
	await (project as any).importFiles({
		pluginKey: "plugin.inlang.nextIntl",
		files: Object.entries(messages).map(([locale, json]) => ({
			locale,
			content: encode(JSON.stringify(json)),
		})),
	});
	return project as any;
}

test("the current next-intl plugin from settings.modules finds unused messages and usages", async () => {
	const project = await nextIntlProject("current");
	const result = await checkProject({
		project,
		files,
		checks: ["unused-message"],
	});
	expect(result.checks).toEqual([{ id: "unused-message", status: "complete" }]);
	expect(result.diagnostics.map((diagnostic) => diagnostic.bundleId)).toEqual([
		"Home.unused",
	]);
	const usages = await findUsages({ project, files });
	expect(
		usages.references.map(
			(reference) =>
				`${reference.bundleId} ${reference.path}:${reference.start.line}`
		)
	).toEqual([
		"Home.title src/app/[locale]/page.tsx:4",
		"Nav.home src/content/nav.mdx:5",
	]);
});

test("the published next-intl plugin has no usage analysis: unused messages are unavailable", async () => {
	const project = await nextIntlProject("published");
	const result = await checkProject({
		project,
		files,
		checks: ["unused-message"],
	});
	expect(result.checks).toEqual([
		expect.objectContaining({ id: "unused-message", status: "unavailable" }),
	]);
	expect(result.diagnostics).toEqual([]);
});
