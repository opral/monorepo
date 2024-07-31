import { useEffect, useState } from "react";
import Layout from "../../layout.tsx";
import { poll } from "../../poll.ts";
import { projectAtom } from "../../state.ts";
import { useAtom } from "jotai";
import { Settings } from "@inlang/sdk2";

export default function App() {
	const [project] = useAtom(projectAtom);
	const settings2 = project?.settings.get();
	console.log("rendering", settings2);
	const [settings, setSettings] = useState<Settings | undefined>(
		project?.settings.get()
	);

	useEffect(() => {
		poll({
			every: 5000,
			fn: async () => {
				setSettings(project?.settings.get());
			},
		});
	}, [project?.settings]);

	return (
		<>
			<Layout>
				<p>settings {settings?.modules ?? "fallback"}</p>
				<p>settings 2 {settings2?.modules ?? "fallback"}</p>
			</Layout>
		</>
	);
}
