import { useEffect, useState } from "react";
import Layout from "../../layout.tsx";
import { poll } from "../../poll.ts";
import { projectAtom } from "../../state.ts";
import { useAtom } from "jotai";
import { Settings } from "@inlang/sdk2";

export default function App() {
	const [project] = useAtom(projectAtom);
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
				<p>{settings?.modules ?? "fallback"}</p>
			</Layout>
		</>
	);
}
