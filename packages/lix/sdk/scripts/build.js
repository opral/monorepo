#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";

const require = createRequire(import.meta.url);

const cliArgs = process.argv.slice(2);

function consumeFlag(flag) {
	const index = cliArgs.indexOf(flag);
	if (index !== -1) {
		cliArgs.splice(index, 1);
		return true;
	}
	return false;
}

const watch = consumeFlag("--watch");
const setupOnly = consumeFlag("--setup-only");

function logStep(label) {
	console.log(`[build] ${label}`);
}

async function runStep(label, action) {
	logStep(label);
	await action();
}

async function run() {
	try {
		await runStep(
			"Embedding sqlite.wasm",
			() => import("./embed-sqlite-wasm.js")
		);
		await runStep(
			"Updating environment variables",
			() => import("../src/services/env-variables/create-index-file.js")
		);
	} catch (error) {
		console.error("[build] setup failed:\n", error);
		process.exitCode = 1;
		return;
	}

	if (setupOnly) {
		if (watch) {
			console.warn("[build] Ignoring --watch when --setup-only is set.");
		}
		return;
	}

	const tscBin = require.resolve("typescript/bin/tsc");
	const tscArgs = [tscBin, "--build", ...cliArgs];
	if (watch) {
		tscArgs.push("--watch", "--preserveWatchOutput");
	}

	logStep(`Running TypeScript (${watch ? "watch" : "build"} mode)`);

	const child = spawn(process.execPath, tscArgs, {
		stdio: "inherit",
	});

	child.on("error", (err) => {
		console.error("[build] TypeScript process failed:\n", err);
		process.exit(1);
	});

	if (watch) {
		child.on("exit", (code) => {
			process.exit(code ?? 0);
		});
		return;
	}

	await new Promise((resolve, reject) => {
		child.on("exit", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`TypeScript exited with code ${code}`));
			}
		});
	});
}

run().catch((error) => {
	console.error("[build] Unexpected error:\n", error);
	process.exit(1);
});
