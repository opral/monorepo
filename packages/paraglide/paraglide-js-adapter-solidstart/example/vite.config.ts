import { defineConfig } from "vite"
import solid from "solid-start/vite"
import nodeAdapter from "solid-start-node"

export default defineConfig({
	plugins: [solid({ adapter: nodeAdapter() })],
})
