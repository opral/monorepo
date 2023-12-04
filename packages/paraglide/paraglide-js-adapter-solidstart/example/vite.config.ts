import * as vite from "vite"
import solid from "solid-start/vite"
import nodeAdapter from "solid-start-node"

export default vite.defineConfig({
	plugins: [solid({ adapter: nodeAdapter() })],
})
