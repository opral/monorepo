import Layout from "../../layout.tsx";
import {
	bundlesNestedAtom,
	projectAtom,
	selectedProjectPathAtom,
} from "../../state.ts";
import { useAtom } from "jotai";
import InlangBundle from "../../components/InlangBundle.tsx";

export default function App() {
	const [project] = useAtom(projectAtom);
	const [selectedProjectPath] = useAtom(selectedProjectPathAtom);
	const [bundlesNested] = useAtom(bundlesNestedAtom);

	return (
		<>
			<Layout>
				{bundlesNested.length > 0 &&
					bundlesNested.map((bundle) => (
						<InlangBundle key={bundle.id} bundle={bundle} />
					))}
				{(!project || !selectedProjectPath) && <>No project selected</>}
				{project && selectedProjectPath && bundlesNested.length === 0 && (
					<>No bundles found, please import demo ...</>
				)}
			</Layout>
		</>
	);
}
