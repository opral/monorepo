import { useEffect, useState } from "react";
import Layout, { Grid } from "../../layout.tsx";
import { useAtom } from "jotai";
import { projectAtom } from "../../state.js";
import Settings from "../../components/InlangSettings.tsx";
import { Link } from "react-router-dom";
import { SlButton } from "@shoelace-style/shoelace/dist/react";

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
		}, 2000);
	}, [project]);

	return (
		<>
			<Layout>
				<Grid>
					<div className="flex items-center mb-8 gap-4 mt-8">
						<Link to="/">
							<SlButton slot="trigger" size="small" variant="default">
								Back
							</SlButton>
						</Link>
						<h1 className="text-2xl">Settings</h1>
					</div>

					{project && settings && (
						<Settings
							settings={settings}
							// @ts-expect-error - TODO: fix this
							onSetSettings={(event: CustomEvent) => {
								//console.log("event.detail.arguments", event.detail.argument);
								project.settings.set(event.detail.argument);
							}}
						/>
					)}
				</Grid>
			</Layout>
		</>
	);
}
