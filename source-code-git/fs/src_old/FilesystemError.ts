export class FilesystemError extends Error {
	code: string
	path: string

	constructor(code: string, path: string) {
		let message
		switch (code) {
			case "ENOENT":
				message = `${code}: No such file or directory. Path: "${path}"`
				break
			case "ENOTDIR":
				message = `${code}: Not a directory. Path: "${path}`
				break
			case "EISDIR":
				message = `${code}: Illegal operation on a directory. Path: "${path}"`
				break
			case "ENOTEMPTY":
				message = `${code}: Directory not empty. Path: "${path}"`
				break
			default:
				message = `Unknown error with code "${code}". Path: "${path}"`
		}
		super(message)
		this.name = "FilesystemError"
		this.code = code
		this.path = path
	}
}
