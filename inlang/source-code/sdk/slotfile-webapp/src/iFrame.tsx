import { useEffect, useRef } from "react"
import { NodeishFilesystemSubset, makeFsAvailableTo } from "../../dist/v2/index.js"
import * as Comlink from "comlink"

export function IFrame({ src, withFs }: { src: string; withFs: NodeishFilesystemSubset }) {
	const ref = useRef<HTMLIFrameElement>()

	useEffect(() => {
		if (!ref.current || !ref.current.contentWindow) throw new Error("ref.current is undefined")
		console.log("withFs", withFs, "ref.current.contentWindow", ref.current.contentWindow)

		const _fs = {
			...withFs,
			readFile: async (...args: any) => {
				console.log("readFile args", ...args)
				const content = await withFs.readFile(...args)
				console.log("readFile content", content)
				return content
			},
		}
		makeFsAvailableTo(_fs, Comlink.windowEndpoint(ref.current.contentWindow))
	})

	return <iframe ref={ref} src={src} style={{ width: "100%", height: "100%" }} />
}
