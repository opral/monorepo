import Layout, { Grid } from "../../layout.tsx";
import { useAtom } from "jotai";
import { projectAtom, settingsAtom } from "../../state.js";
import Settings from "../../components/InlangSettings.tsx";

export default function App() {
	const [project] = useAtom(projectAtom);
	const [settings] = useAtom(settingsAtom);

	return (
		<>
			<Layout>
				<div className="bg-white border-b border-zinc-200 mb-8">
					<Grid>
						<div className="py-6 flex justify-between items-center">
							<h2 className="text-[20px]">Settings</h2>
						</div>
					</Grid>
				</div>
				<Grid>
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
