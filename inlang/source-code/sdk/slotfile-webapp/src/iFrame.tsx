import { useEffect, useRef } from "react"
import { NodeishFilesystemSubset, makeFsAvailableTo } from "../../dist/v2/index.js"
import * as Comlink from "comlink"

export function IFrame({ src, withFs }: { src: string; withFs: NodeishFilesystemSubset }) {
	const ref = useRef<HTMLIFrameElement>()

	useEffect(() => {
		if (!ref.current || !ref.current.contentWindow) throw new Error("ref.current is undefined")
		makeFsAvailableTo(withFs, Comlink.windowEndpoint(ref.current.contentWindow))
	})

	return <iframe ref={ref} src={src} style={{ width: "100%", height: "100%" }} />
}
