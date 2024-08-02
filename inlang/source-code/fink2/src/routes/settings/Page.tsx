import { useEffect } from "react"
import Layout from "../../layout.tsx";
import { useAtom } from "jotai"
import { projectAtom } from "../../state.js"
import Settings from "../../components/InlangSettings.tsx"

export default function App() {
	const [project] = useAtom(projectAtom)

	useEffect(() => {
		console.log(project?.settings.get())
	})

	return (
		<>
			<Layout>
				<h1 className="text-2xl -mt-8 mb-8">Settings</h1>
				{project && project?.settings.get() && (
					<Settings
						settings={project?.settings.get()}
						// @ts-expect-error - TODO: fix this
						onSetSettings={(event: CustomEvent) => {
							// console.log(settings)
							console.log("event.detail", event.detail);
							project.settings.set(event.detail);
						}}
					/>
				)}
			</Layout>
		</>
	);
}