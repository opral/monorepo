export class FilesystemError extends Error {
	code: string
	path: string
	syscall: string
	target?: string

	constructor(code: string, path: string, syscall: string, target?: string) {
		let message
		switch (code) {
			case "ENOENT":
				message = `${code}: No such file or directory, ${syscall} '${path}'`
				break
			case "ENOTDIR":
				message = `${code}: Not a directory, ${syscall} '${path}'`
				break
			case "EISDIR":
				message = `${code}: Illegal operation on a directory, ${syscall} '${path}'`
				break
			case "ENOTEMPTY":
				message = `${code}: Directory not empty, ${syscall} '${path}'`
				break
			case "EEXIST":
				message = `${code}: File exists, ${syscall} '${path}' -> '${target}'`
				break
			case "EINVAL":
				message = `${code}: Invaid argument, ${syscall} '${path}'`
				break

			default:
				message = `Unknown error with code "${code}", '${syscall}' on '${path}'`
		}
		super(message)
		this.name = "FilesystemError"
		this.code = code
		this.path = path
		this.syscall = syscall
		this.target = target
	}
}
