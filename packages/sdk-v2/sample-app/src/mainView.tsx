import { useState } from "react"
import { MessageBundleList } from "./messageBundleListReact.js"
import { type InlangProject2, MessageBundle, getFs, loadProject } from "../../dist/v2/index.js"
import { SettingsView } from "./settingsView.js"

import { createMockBundle } from "../../src/mock/mockhelper.js"
import { InlangProject, NestedBundle, NestedBundle } from "../../src/types/index.js"

export function MainView({ inlangProject }: { inlangProject: InlangProject2 }) {
	const [currentView, setCurrentView] = useState<"overview" | "messageList" | "settings">(
		"settings"
	)

	const insertNMessageBundles = async (project: InlangProject, n: number) => {
		const messagesToAdd = [] as NestedBundle[]
		for (let i = 0; i < n; i++) {
			const newBundle = createMockBundle({
				languageTags: ["de"],
				nInputs: 3,
				nSelectors: 2,
				nExpressions: 3,
			})

			// messagesToAdd.push(newBundle)

			console.time("inserting " + n + " messageBundles")
			await project.bundle.insert(newBundle).execute()
			console.timeEnd("inserting " + n + " messageBundles")
		}
	}

	return (
		<div>
			<div>
				<br />
				<h2>Actions</h2>
				Add Message Bundles
				<button
					style={{ marginLeft: 10 }}
					id="btnAdd1"
					onClick={() => {
						insertNMessageBundles(inlangProject, 1)
					}}
				>
					+ 1{" "}
				</button>
				<button
					id="btnAdd100"
					onClick={() => {
						insertNMessageBundles(inlangProject, 100)
					}}
				>
					+ 100{" "}
				</button>
				<button
					id="btnAdd1000"
					onClick={() => {
						insertNMessageBundles(inlangProject, 1000)
					}}
				>
					+ 1000{" "}
				</button>
				<br />
				<div className="tab-container">
					<div
						className={`tab ${currentView === "overview" ? "active" : ""}`}
						onClick={() => setCurrentView("overview")}
					>
						Overview
					</div>
					<div
						className={`tab ${currentView === "messageList" ? "active" : ""}`}
						onClick={() => setCurrentView("messageList")}
					>
						MessageList
					</div>
					<div
						className={`tab ${currentView === "settings" ? "active" : ""}`}
						onClick={() => setCurrentView("settings")}
					>
						Settings
					</div>
				</div>
				{/* {currentView === "settings" && (
					<SettingsView
						project={{
							projectPath: projectPath,
							inlangProject: inlangProject,
						}}
					></SettingsView>
				)} */}
				{currentView === "messageList" && (
					<>
						{/* 
	We need to filter:
	- languages (languageTag) message.locale in (...languageTag)
	- lint reports (lint id) reports.lintId in (...reportIds)
	- bundles (bundle id) bundles.id in (...bundleIds)
	- 
	
	 and search by 					
						<!-- search/filter component --> 
*/}
						<MessageBundleList project={inlangProject}></MessageBundleList>
					</>
				)}
			</div>
		</div>
	)
}
