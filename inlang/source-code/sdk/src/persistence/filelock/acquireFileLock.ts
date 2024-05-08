import { type NodeishFilesystem } from "@lix-js/fs"
import type { NodeishStats } from "@lix-js/fs"
import _debug from "debug"
const debug = _debug("sdk:acquireFileLock")

const maxRetries = 10
const nProbes = 50
const probeInterval = 100
export async function acquireFileLock(
	fs: NodeishFilesystem,
	lockDirPath: string,
	lockOrigin: string,
	tryCount: number = 0
): Promise<number> {
	if (tryCount > maxRetries) {
		throw new Error(lockOrigin + " exceeded maximum Retries (5) to acquire lockfile " + tryCount)
	}

	try {
		debug(lockOrigin + " tries to acquire a lockfile Retry Nr.: " + tryCount)
		await fs.mkdir(lockDirPath)
		const stats = await fs.stat(lockDirPath)
		debug(lockOrigin + " acquired a lockfile Retry Nr.: " + tryCount)
		return stats.mtimeMs
	} catch (error: any) {
		if (error.code !== "EEXIST") {
			// we only expect the error that the file exists already (locked by other process)
			throw error
		}
	}

	let currentLockTime: number

	try {
		const stats = await fs.stat(lockDirPath)
		currentLockTime = stats.mtimeMs
	} catch (fstatError: any) {
		if (fstatError.code === "ENOENT") {
			// lock file seems to be gone :) - lets try again
			debug(lockOrigin + " tryCount++ lock file seems to be gone :) - lets try again " + tryCount)
			return acquireFileLock(fs, lockDirPath, lockOrigin, tryCount + 1)
		}
		throw fstatError
	}
	debug(
		lockOrigin +
			" tries to acquire a lockfile  - lock currently in use... starting probe phase " +
			tryCount
	)

	return new Promise((resolve, reject) => {
		let probeCounts = 0
		const scheduleProbationTimeout = () => {
			setTimeout(async () => {
				probeCounts += 1
				let lockFileStats: undefined | NodeishStats = undefined
				try {
					debug(
						lockOrigin + " tries to acquire a lockfile - check if the lock is free now " + tryCount
					)

					// alright lets give it another try
					lockFileStats = await fs.stat(lockDirPath)
				} catch (fstatError: any) {
					if (fstatError.code === "ENOENT") {
						debug(
							lockOrigin +
								" tryCount++ in Promise - tries to acquire a lockfile - lock file seems to be free now - try to acquire " +
								tryCount
						)
						const lock = acquireFileLock(fs, lockDirPath, lockOrigin, tryCount + 1)
						return resolve(lock)
					}
					return reject(fstatError)
				}

				// still the same locker! -
				if (lockFileStats.mtimeMs === currentLockTime) {
					if (probeCounts >= nProbes) {
						// ok maximum lock time ran up (we waitetd nProbes * probeInterval) - we consider the lock to be stale
						debug(
							lockOrigin +
								" tries to acquire a lockfile  - lock not free - but stale lets drop it" +
								tryCount
						)
						try {
							await fs.rmdir(lockDirPath)
						} catch (rmLockError: any) {
							if (rmLockError.code === "ENOENT") {
								// lock already gone?
								// Option 1: The "stale process" decided to get rid of it
								// Option 2: Another process acquiring the lock and detected a stale one as well
							}
							return reject(rmLockError)
						}
						try {
							debug(
								lockOrigin +
									" tryCount++ same locker - try to acquire again after removing stale lock " +
									tryCount
							)
							const lock = await acquireFileLock(fs, lockDirPath, lockOrigin, tryCount + 1)
							return resolve(lock)
						} catch (lockAquireException) {
							return reject(lockAquireException)
						}
					} else {
						// lets schedule a new probation
						return scheduleProbationTimeout()
					}
				} else {
					try {
						debug(lockOrigin + " tryCount++ different locker - try to acquire again " + tryCount)
						const lock = await acquireFileLock(fs, lockDirPath, lockOrigin, tryCount + 1)
						return resolve(lock)
					} catch (error) {
						return reject(error)
					}
				}
			}, probeInterval)
		}
		scheduleProbationTimeout()
	})
}
