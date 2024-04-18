import { spawn, spawnSync } from "node:child_process"

/**
 * Runs the Paraglide compiler in a child process
 */
export function useCompiler(options: {
	/**
	 * CWD relative path to the Inlang project
	 */
	project: string

	/**
	 * CWD relative path to the output directory
	 */
	outdir: string

	/**
	 * Whether to watch for file changes and recompile (will spawn long running process)
	 */
	watch?: boolean
}) {
	try {
		const command = `npx paraglide-js compile --project ${options.project} --outdir ${
			options.outdir
		}${options.watch ? " --silent" : ""}`
		spawnSync(command, {
			cwd: process.cwd(),
			stdio: "inherit",
			shell: true,
		})

		if (options.watch) {
			spawn(
				`npx paraglide-js compile --project ${options.project} --outdir ${options.outdir} --watch`,
				{
					cwd: process.cwd(),
					stdio: "inherit",
					shell: true,
					detached: false, //make sure the child process is killed when this process is killed
				}
			)
		}
		// eslint-disable-next-line no-empty
	} catch (e) {}
}
