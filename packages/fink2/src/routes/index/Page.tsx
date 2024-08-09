import Layout from "../../layout.tsx";
import {
	bundlesNestedAtom,
	projectAtom,
	selectedProjectPathAtom,
} from "../../state.ts";
import { useAtom } from "jotai";
import InlangBundle from "../../components/InlangBundle.tsx";
// import {
// 	InlangBundleHeader,
// 	InlangMessage,
// 	InlangPatternEditor,
// 	InlangVariant,
// } from "../../components/SingleDiffBundle.tsx";
// import VariantHistory from "../../components/VariantHistory.tsx";

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
				{/* <div className="mt-8">
					{bundlesNested.length > 0 &&
						bundlesNested.map((bundle) => {
							return (
								<div key={bundle.id}>
									<InlangBundleHeader
										bundle={bundle}
										settings={project?.settings.get()}
									/>
									{bundle.messages.map((message) => {
										return (
											<div key={message.id}>
												<InlangMessage
													message={message}
													locale={message.locale}
													settings={project?.settings.get()}
												>
													{message.variants.map((variant) => {
														return (
															<InlangVariant
																slot="variant"
																key={variant.id}
																bundleId={bundle.id}
																message={message}
																locale={message.locale}
																variant={variant}
															>
																<InlangPatternEditor
																	slot="pattern-editor"
																	pattern={variant.pattern}
																/>
																<VariantHistory variantId={variant.id} />
															</InlangVariant>
														);
													})}
												</InlangMessage>
											</div>
										);
									})}
								</div>
							);
						})}
				</div> */}
				{(!project || !selectedProjectPath) && <>No project selected</>}
				{project && selectedProjectPath && bundlesNested.length === 0 && (
					<>No bundles found, please import demo ...</>
				)}
			</Layout>
		</>
	);
}