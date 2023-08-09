import type { InlangConfig } from "@inlang/app"
import { createEffect, createSignal, Show, createResource, createRoot } from "solid-js"

//type InstanceType = { config: Accessor<boolean>; setConfig: Setter<boolean> }

export const Page = () => {
	const [instance] = createResource(asyncSignalGetter)

	createEffect(() => {
		if (!instance.loading) {
			console.log("config changes", instance()?.config())
		}
	})

	setTimeout(() => {
		console.log("timeout set config")
		instance()?.setConfig(true)
	}, 2000)

	return (
		<div>
			<Show when={!instance.loading} fallback={<div>loading</div>}>
				<div>{String(instance()!.config())}</div>
			</Show>
		</div>
	)
}

const asyncSignalGetter = async () => {
	return await createRoot(async () => {
		const [config, setConfig] = createSignal(false)
		await new Promise((r) => setTimeout(r, 1000))
		return {
			config: config,
			setConfig: setConfig,
		}
	})
}
