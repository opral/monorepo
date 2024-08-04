import type { loadProject } from "./loadProject.js"

export type InlangProject = Awaited<ReturnType<typeof loadProject>>
