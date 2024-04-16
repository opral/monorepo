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
