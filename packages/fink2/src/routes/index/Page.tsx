import Layout from "../../layout.tsx";
import { projectAtom } from "../../state.ts";
import { useAtom } from "jotai";
// import { MessageBundle } from "../../components/InlangBundle.tsx";
// import { mockBundle } from "../../mock/mockHelper.ts";

export default function App() {
	const [project] = useAtom(projectAtom);
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
