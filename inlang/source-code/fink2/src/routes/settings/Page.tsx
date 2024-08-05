import { useEffect, useState } from "react";
import Layout from "../../layout.tsx";
import { useAtom } from "jotai";
import { projectAtom } from "../../state.js";
import Settings from "../../components/InlangSettings.tsx";

export default function App() {
	const [project] = useAtom(projectAtom);
	const [settings, setSettings] = useState(project?.settings.get());

	useEffect(() => {
		setInterval(() => {
			const settings = project?.settings.get();
			if (settings) {
				// TODO not working why?
				setSettings(settings);
			}
		}, 3000);
	}, [project]);

	return (
		<>
			<Layout>
				<h1 className="text-2xl -mt-8 mb-8">Settings</h1>
				{project && settings && (
					<Settings
						settings={settings}
						// @ts-expect-error - TODO: fix this
						onSetSettings={(event: CustomEvent) => {
							console.log("event.detail.arguments", event.detail.argument);
							project.settings.set(event.detail.argument);
						}}
					/>
				)}
			</Layout>
		</>
	);
}
