import { useState } from "react"
import { loadProjectOpfs, newProjectOpfs } from "../../src/index.js"
import { MainView } from "./mainView.js"

const projectPath = "workingCopy.inlang"

export function PageView() {
	const [loadingProjectState, setLoadingProjectState] = useState<string>("")
	const [currentProject, setCurrentProject] = useState<
		Awaited<ReturnType<typeof loadProjectOpfs>> | undefined
	>(undefined)

	const newProject = async () => {
		await newProjectOpfs({
			inlangFolderPath: projectPath,
		})
		await loadProject()
	}

	const loadProject = async () => {
		setLoadingProjectState("Loading")
		try {
			const loadedProject = await loadProjectOpfs({
				inlangFolderPath: projectPath,
			})
			setCurrentProject(loadedProject)
		} catch (e) {
			setLoadingProjectState((e as any).message)
			return
		}

		setLoadingProjectState("")
	}

	return (
		<div style={{ height: "100%" }}>
			<h3>{"Fink 2"}</h3>
			<div>
				<button id="btnAdd1" onClick={newProject} disabled={loadingProjectState === "Loading"}>
					New Project
				</button>
				<button id="btnAdd1" onClick={loadProject} disabled={loadingProjectState === "Loading"}>
					Load Current Project
				</button>
			</div>
			{loadingProjectState}
			{currentProject && (
				<>
					<br />
					<br />
					{/* <button
						id="commit"
						type="button"
						onClick={() => {
							commit(currentProject)
						}}
						disabled={gitActive}
					>
						Commit Changes
					</button>
					<button
						id="push"
						type="button"
						onClick={() => {
							push(currentProject)
						}}
						disabled={gitActive}
					>
						Push Changes
					</button>
					<br />
					<br />
					<button
						id="pull"
						type="button"
						onClick={() => {
							pull(currentProject)
						}}
						disabled={gitActive}
					>
						Pull Changes
					</button> */}
					<div className="container">
						<div className="left">
							<MainView inlangProject={currentProject} />
						</div>
						{/* <div className="right">
							<IFrame src={"/?inlangProjectPath=" + inlangProjectPath} withFs={fs} />
						</div> */}
					</div>
				</>
			)}
		</div>
	)
}
