import Layout from "../../layout.tsx";
import { projectAtom } from "../../state.ts";
import { useAtom } from "jotai";
import { MessageBundle } from "../../components/InlangBundle.tsx";
import { pluralBundle } from "@inlang/sdk2";
import { insertNestedBundle } from "../../helper/insertNestedBundle.ts";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { useState } from "react";

export default function App() {
	const [project] = useAtom(projectAtom);
	const [bundleIds, setBundleIds] = useState<string[]>([]);
	const getBundleIds = async () => {
		const bundleIdsList = await project?.db.selectFrom("bundle").selectAll().execute() ?? [];
		setBundleIds(bundleIdsList.map((bundle) => bundle.id));
	}
	// const getBundleById = async (bundleId: string) => {
	// 	await project?.db.selectFrom("bundle").where("id", "=", bundleId).execute()
	// }

	return (
		<>
			<Layout>
				<SlButton className="mr-2" onClick={() => insertNestedBundle(project, pluralBundle)}>Insert Plural Bundle</SlButton>
				<SlButton onClick={getBundleIds}>Get Bundle IDs</SlButton>
				{project &&
					<MessageBundle
					bundle={pluralBundle}
					settings={project.settings.get()}
				/>
				}
				{/* {project &&
					bundleIds.map((bundleId) => (
						<MessageBundle
							key={bundleId}
							bundle={getBundleById}
							settings={project.settings.get()}
						/>
					))
				} */}
			</Layout>
		</>
	);
}
