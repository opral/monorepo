import childProcess from "node:child_process"

/**
 * Executes a command asynchronously in a separate process.
 * It will not print the output to the console.
 *
 * @param command The command to execute.
 * @returns The stdout of the command.
 */
export function execAsync(command: string) {
	return new Promise<string>((resolve, reject) => {
		childProcess.exec(command, (error, stdout) => {
			if (error) {
				reject(error)
			} else {
				resolve(stdout)
			}
		})
	})
}

export function longestCommonPrefix(strA: string, strB: string): string {
	let commonPrefix = ""
	for (let i = 0; i < Math.min(strA.length, strB.length); i++) {
		if (strA[i] === strB[i]) {
			commonPrefix += strA[i]
		} else {
			break
		}
	}
	return commonPrefix
}

export function getCommonPrefix(strings: string[]): string {
	const strs = strings.filter(Boolean)
	const firstString = strs[0]
	if (firstString === undefined) {
		return ""
	}

	return strs.reduce((commonPrefix, str) => longestCommonPrefix(commonPrefix, str), firstString)
}
