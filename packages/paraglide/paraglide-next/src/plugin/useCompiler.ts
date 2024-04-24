import { spawn, spawnSync } from "node:child_process"

type CompileOptions = {
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
	watch: boolean

	/**
	 * If the compiler should be silents
	 */
	silent: boolean
}

/**
 * Runs the Paraglide compiler in a child process
 */
export function useCompiler(options: CompileOptions) {
	try {
		const command = getCompileCommand(options)
		spawnSync(command, {
			cwd: process.cwd(),
			stdio: "inherit",
			shell: true,
		})

		if (options.watch) {
			const command = getWatchCommand(options)
			spawn(command, {
				cwd: process.cwd(),
				stdio: "inherit",
				shell: true,
				//make sure the child process is killed when this process is killed
				detached: false,
			})
		}
	} catch (e) {
		console.error("Failed to spawn the Paraglide compiler process")
	}
}

export function getCompileCommand(options: CompileOptions): string {
	const flags = [
		"--project " + options.project,
		"--outdir " + options.outdir,
		options.watch || options.silent ? "--silent" : "",
	].filter(Boolean)

	return `npx @inlang/paraglide-js compile ` + flags.join(" ")
}

export function getWatchCommand(options: CompileOptions): string {
	const flags = [
		"--project " + options.project,
		"--outdir " + options.outdir,
		"--watch",
		options.silent ? "--silent" : "",
	].filter(Boolean)

	return `npx @inlang/paraglide-js compile ` + flags.join(" ")
}
