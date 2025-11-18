import path from "node:path"
import os from "node:os"
import type { Account } from "@inlang/sdk/lix"

export function getLocalAccount(args: { fs: typeof import("node:fs") }): Account | undefined {
	try {
		const accountPath = getAccountFilePath()

		if (!args.fs.existsSync(accountPath)) {
			return
		}

		return JSON.parse(args.fs.readFileSync(accountPath, "utf8"))
	} catch {
		return
	}
}

export function saveLocalAccount(args: { fs: typeof import("node:fs"); account: Account }): void {
	try {
		const accountPath = getAccountFilePath()
		args.fs.mkdirSync(path.dirname(accountPath), { recursive: true })
		args.fs.writeFileSync(accountPath, JSON.stringify(args.account, null, 2))
	} catch {
		// do nothing
	}
}

/**
 * Returns the path to the local account file.
 *
 * Based on the env-paths package https://github.com/sindresorhus/env-paths/blob/main/index.js
 */
export function getAccountFilePath() {
	const homedir = os.homedir()

	if (process.platform === "darwin") {
		return path.join(homedir, "Library", "Application Support", "lix", "account.json")
	} else if (process.platform === "win32") {
		return path.join(homedir, "AppData", "Roaming", "lix", "account.json")
	}
	// linux
	else {
		return path.join(homedir, ".local", "share", "lix", "account.json")
	}
}
