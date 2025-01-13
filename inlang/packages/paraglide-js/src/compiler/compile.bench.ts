import { bench } from "vitest";
import nodeFs from "node:fs";
import path from "node:path";
import { memfs } from "memfs";
import { compile } from "./compile.js";

bench("compile 1000 messages", async () => {
	const numMessages = 1000;

	// the root of the repo
	const repositoryRoot = import.meta.url
		.slice(0, import.meta.url.lastIndexOf("inlang/packages"))
		.replace("file://", "");

	// load the inlang message format plugin to simulate a real project
	const pluginAsText = nodeFs.readFileSync(
		path.join(
			repositoryRoot,
			"inlang/packages/plugins/inlang-message-format/dist/index.js"
		),
		"utf8"
	);

	const mockMessages = Object.fromEntries(
		Array.from({ length: numMessages }, (_, i) => [
			`message_${i}`,
			`Hello world {username}`,
		])
	);

	const fs = memfs({
		"/plugin.js": pluginAsText,
		"/en.json": JSON.stringify(mockMessages),
		"/project.inlang/settings.json": JSON.stringify({
			baseLocale: "en",
			locales: ["en"],
			modules: ["/plugin.js"],
			"plugin.inlang.messageFormat": {
				pathPattern: "/{locale}.json",
			},
		}),
	}).fs as unknown as typeof import("node:fs");

	await compile({
		project: "/project.inlang",
		outdir: "/output",
		fs: fs,
	});
});
