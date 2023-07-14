import { InlangException } from "../../exceptions.js"

export class InlangSdkException extends InlangException {
	constructor(message: string, override readonly cause?: Error) {
		super()

		this.message = `

--------------------------------------------------------------------------------

[${this.constructor.name}]

${message}

--------------------------------------------------------------------------------

Cause:
`
	}
}
