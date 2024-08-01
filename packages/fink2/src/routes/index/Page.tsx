import { useEffect } from "react";
import Layout from "../../layout.tsx";
import { poll } from "../../poll.ts";
import { projectAtom, selectedProjectPathAtom } from "../../state.ts";
import { useAtom } from "jotai";
import { loadProjectFromOpfs } from "@inlang/sdk2";
// import { MessageBundle } from "../../components/InlangBundle.tsx";
// import { mockBundle } from "../../mock/mockHelper.ts";

export default function App() {
	const [project, setProject] = useAtom(projectAtom);
	const [selectedProjectPath] = useAtom(
		selectedProjectPathAtom
	);

	useEffect(() => {
		console.log("project on page", project)
		poll({
			every: 2000,
			fn: async () => {
				if (selectedProjectPath) {
					const project = await loadProjectFromOpfs({ path: selectedProjectPath });
					setProject(project);
				}
			},
		});
	}, []);

	console.log("App rerendered")
	return (
		<>
			<Layout>
				<p>{JSON.stringify(project?.settings.get()) ?? "fallback"}</p>
				{/* <MessageBundle
					// key={bundle.id}
					bundle={mockBundle}
					settings={project?.db.settings.get()}
					changeMessageBundle={onBundleChange as any}
					insertMessage={onMesageInsert as any}
					updateMessage={onMesageUpdate as any}
					insertVariant={onVariantInsert as any}
					updateVariant={onVariantUpdate as any}
					deleteVariant={onVariantDelete as any}
					filteredLocales={filteredLocales.length > 0 ? filteredLocales : undefined}
					fixLint={(e: any) => {
						const { fix, lintReport } = e.detail.argument as {
							fix: string
							lintReport: LintReport
						}
		
						project.fix(lintReport, { title: fix })
					}}
				/> */}
			</Layout>
		</>
	);
}
