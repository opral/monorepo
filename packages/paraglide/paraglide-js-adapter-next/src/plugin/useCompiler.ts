import { spawn, spawnSync } from "node:child_process"

/**
 * Runs the Paraglide compiler in a child process
 */
export function useCompiler(options: { project: string; outdir: string; watch?: boolean }) {
	try {
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
		} else {
			spawnSync(
				`npx paraglide-js compile --project ${options.project} --outdir ${options.outdir}`,
				{
					cwd: process.cwd(),
					stdio: "inherit",
					shell: true,
				}
			)
		}
		// eslint-disable-next-line no-empty
	} catch (e) {}
}
