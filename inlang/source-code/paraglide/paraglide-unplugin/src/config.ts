import { Logger } from "@inlang/paraglide-js/internal"
import path from "node:path"

export type UserConfig = {
	/**
	 * Path to the inlang project from which to take modules
	 * @example `./project.inlang`
	 */
	project: string

	/**
	 * Disable console messages
	 */
	silent?: boolean

	/**
	 * If the `$paraglide` virtual module should be used instead of writing the output to disk.
	 */
	experimentalUseVirtualModules?: boolean

	/**
	 * The output directory to place the compiled files in.
	 *
	 * If `useVirtualModule` is `true`, then the type-declarations for the virtual module will be placed here
	 *
	 * @example `./src/paraglide`
	 */
	outdir: string
}

export type PluginConfig = {
	logger: Logger
	/** Absolute path to the project.inlang folder */
	projectPath: string
	/** Absolute path to the directory in which to write the paraglide files*/
	outdir: `${string}/`
	useVirtualModules: boolean
}

/**
 * Normalizes the input from the user & logs warnings if needed
 */
export function resolveConfig(options: UserConfig): PluginConfig {
	const logger = new Logger({ silent: options.silent ?? false, prefix: true })

	const outputDirectory = path.resolve(process.cwd(), options.outdir)

	let normalizedOutdir = outputDirectory.replaceAll("\\", "/")
	if (!normalizedOutdir.endsWith("/")) normalizedOutdir = normalizedOutdir + "/"

	const normalizedPorjectPath = path.resolve(process.cwd(), options.project)

	return {
		logger,
		projectPath: normalizedPorjectPath,
		outdir: normalizedOutdir as `${string}/`,
		useVirtualModules: options.experimentalUseVirtualModules ?? false,
	}
}
