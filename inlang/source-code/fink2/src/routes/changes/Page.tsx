import { projectAtom } from "../../state.ts";
import { useAtom } from "jotai";
import Layout from "../../layout.tsx";

export default function App() {
	const [project] = useAtom(projectAtom);

	return (
		<>
			<Layout>
				<h1>Changes</h1>
				<p>{JSON.stringify(project?.settings.get())}</p>
			</Layout>
		</>
	);
}
