import type { InlangConfig, InlangProject } from "@inlang/app"
import {
	createEffect,
	createSignal,
	Show,
	createResource,
	createRoot,
	observable,
	from,
} from "solid-js"

//type InstanceType = { config: Accessor<boolean>; setConfig: Setter<boolean> }

export const Page = () => {
	const [instance] = createResource(withSolidReactivity(asyncSignalGetter))
	const [config, setConfig] = createSignal<string | undefined>(undefined)

	createEffect(() => {
		if (!instance.loading) {
			console.log("config changes", instance().config())
		}
	})

	setTimeout(() => {
		console.log("timeout set config")
		instance()?.setConfig("new")
	}, 2000)

	return (
		<div>
			<Show when={!instance.loading} fallback={<div>loading</div>}>
				<div>{String(instance().config())}</div>
			</Show>
		</div>
	)
}

const asyncSignalGetter = async () => {
	return await createRoot(async () => {
		const [config, setConfig] = createSignal("test")
		await new Promise((r) => setTimeout(r, 1000))
		return {
			config: observable(config),
			setConfig: setConfig,
		}
	})
}
