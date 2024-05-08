import { type NodeishFilesystem } from "@lix-js/fs"
import _debug from "debug"
const debug = _debug("sdk:releaseLock")

export async function releaseLock(
	fs: NodeishFilesystem,
	lockDirPath: string,
	lockOrigin: string,
	lockTime: number
) {
	debug(lockOrigin + " releasing the lock ")
	try {
		const stats = await fs.stat(lockDirPath)
		if (stats.mtimeMs === lockTime) {
			// this can be corrupt as welll since the last getStat and the current a modification could have occured :-/
			await fs.rmdir(lockDirPath)
		}
	} catch (statError: any) {
		debug(lockOrigin + " couldn't release the lock")
		if (statError.code === "ENOENT") {
			// ok seeks like the log was released by someone else
			debug(lockOrigin + " WARNING - the lock was released by a different process")
			return
		}
		debug(statError)
		throw statError
	}
}
