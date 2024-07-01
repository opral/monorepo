import React, { KeyboardEventHandler, useEffect, useState } from "react"
import { openProject } from "./storage/db-messagebundle.js"
import { loadProject } from "../../dist/loadProject.js"
import debug from "debug"
import { pluralBundle } from "../../src/v2/mocks/index.js"
import { randomHumanId } from "../../src/storage/human-id/human-readable-id.js"
import { createMessage, createMessageBundle } from "../../src/v2/helper.js"
import { MessageBundleList } from "./messageBundleListReact.js"
import { MessageBundle } from "../../dist/v2/index.js"
import { SettingsView } from "./settingsView.js"

export function MainView() {
	const [githubToken, setGithubToken] = useState<string>(localStorage.ghToken)

	const [currentView, setCurrentView] = useState<"overview" | "messageList" | "settings">(
		"settings"
	)

	const onGithubTokenChange = (el: any) => {
		const ghToken = el.target.value
		localStorage.ghToken = ghToken
		setGithubToken(ghToken)
		setCurrentProject(undefined)
	}

	const params = new URLSearchParams(window.location.search)
	const repo = params.get("repo") ?? localStorage.repo ?? ""

	const [repoUrl, setRepoUrl] = useState<string>(repo)

	const onRepoUrlChange = (el: any) => {
		const repoUrl = el.target.value
		setRepoConfigs(repoUrl)
		setCurrentProject(undefined)
	}

	const setRepoConfigs = (repoUrl: string) => {
		const url = new URL(window.location as any)
		const params = new URLSearchParams(url.search)
		params.set("repo", repoUrl)
		url.search = params.toString()
		window.history.pushState({}, "", url)
		setRepoUrl(repoUrl)
		localStorage.repo = repoUrl
	}

	const [inlangProjectPath, setInlangProjectPath] = useState<string>(
		params.get("inpangProjectPath") ?? localStorage.inpangProjectPath ?? ""
	)

	const onInlangRepoPathChange = (el: any) => {
		const projpath = el.target.value
		setInlangProjectPathConfigs(projpath)
		setCurrentProject(undefined)
	}

	const setInlangProjectPathConfigs = (projectPath: string) => {
		const url = new URL(window.location as any)
		const params = new URLSearchParams(url.search)
		params.set("inpangProjectPath", projectPath)
		url.search = params.toString()
		window.history.pushState({}, "", url)
		setInlangProjectPath(projectPath)
		localStorage.inpangProjectPath = projectPath
	}

	const [loadingProjectState, setLoadingProjectState] = useState<string>("")
	const [currentProject, setCurrentProject] = useState<
		Awaited<ReturnType<typeof openProject>> | undefined
	>(undefined)

	useEffect(() => {
		if (githubToken && repoUrl && inlangProjectPath) {
			doLoadProject()
		}
	}, [])
	const doLoadProject = async () => {
		setLoadingProjectState("Loading")
		try {
			const loadedProject = await openProject(githubToken, repoUrl, inlangProjectPath)
			setInlangProjectPathConfigs(inlangProjectPath)
			setRepoConfigs(repoUrl)
			setCurrentProject(loadedProject)
		} catch (e) {
			setLoadingProjectState((e as any).message)
			return
		}

		setLoadingProjectState("")
	}

	const [gitActive, setGitActive] = useState(false)
	const pull = async (project: Awaited<ReturnType<typeof openProject>>) => {
		setGitActive(true)
		await project.pullChangesAndReloadSlots()
		setGitActive(false)
		// 	await s.pullChangesAndReloadSlots()
		// 	document.querySelector<HTMLButtonElement>("#pull")!.disabled = false
	}

	const push = async (project: Awaited<ReturnType<typeof openProject>>) => {
		setGitActive(true)
		await project.pushChangesAndReloadSlots()
		setGitActive(false)
		// 	await s.pullChangesAndReloadSlots()
		// 	document.querySelector<HTMLButtonElement>("#pull")!.disabled = false
	}

	const commit = async (project: Awaited<ReturnType<typeof openProject>>) => {
		setGitActive(true)
		await project.commitChanges()
		setGitActive(false)
		// 	await s.pullChangesAndReloadSlots()
		// 	document.querySelector<HTMLButtonElement>("#pull")!.disabled = false
	}

	const insertNMessageBundles = async (
		project: Awaited<ReturnType<typeof openProject>>,
		n: number
	) => {
		const messagesToAdd = [] as MessageBundle[]
		for (let i = 0; i < n; i++) {
			const newMessage = createMessage({
				locale: "de",
				text: "new",
			})

			const messageBundle = createMessageBundle({
				alias: {},
				messages: [newMessage],
			})
			messagesToAdd.push(messageBundle)
		}

		const messageBundles = project.inlangProject.messageBundleCollection
		if (n === 1) {
			const temp = structuredClone(pluralBundle)
			temp.id = randomHumanId()
			temp.messages[0].id = randomHumanId()
			temp.messages[1].id = randomHumanId()

			await messageBundles.insert(temp as any)
			return
		}

		console.time("inserting " + n + " messageBundles")

		await project.inlangProject.messageBundleCollection.bulkInsert(messagesToAdd)
		console.timeEnd("inserting " + n + " messageBundles")
	}

	return (
		<div>
			<h3>Fink 2</h3>
			<div>
				GitHub token:{" "}
				<input
					type="password"
					id="ghtoken"
					name="ghtoken"
					defaultValue={githubToken}
					onKeyUp={onGithubTokenChange}
					style={{ marginRight: 10 }}
				/>
				Github repo:{" "}
				<input
					type="text"
					id="repourl"
					name="repourl"
					defaultValue={repoUrl}
					onKeyUp={onRepoUrlChange}
					style={{ marginRight: 10 }}
				/>
				Inlang Project Path:{" "}
				<input
					type="text"
					id="inlangProjectPath"
					name="repourl"
					defaultValue={inlangProjectPath}
					onKeyUp={onInlangRepoPathChange}
					style={{ marginRight: 10 }}
				/>
				<button id="btnAdd1" onClick={doLoadProject} disabled={loadingProjectState === "Loading"}>
					(Re) Load Project
				</button>
				{loadingProjectState}
				{currentProject && (
					<>
						<br />
						<h2>Actions</h2>
						Add Message Bundles
						<button
							style={{ marginLeft: 10 }}
							id="btnAdd1"
							onClick={() => {
								insertNMessageBundles(currentProject, 1)
							}}
						>
							+ 1{" "}
						</button>
						<button
							id="btnAdd100"
							onClick={() => {
								insertNMessageBundles(currentProject, 100)
							}}
						>
							+ 100{" "}
						</button>
						<button
							id="btnAdd1000"
							onClick={() => {
								insertNMessageBundles(currentProject, 1000)
							}}
						>
							+ 1000{" "}
						</button>
						<br />
						<br />
						<button
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
						</button>
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
						{currentView === "settings" && <SettingsView project={currentProject}></SettingsView>}
						{currentView === "messageList" && (
							<MessageBundleList project={currentProject}></MessageBundleList>
						)}
					</>
				)}
			</div>
		</div>
	)
}
