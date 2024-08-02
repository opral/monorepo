import type { loadProjectInMemory } from "./loadProjectInMemory.js"

export type InlangProject = Awaited<ReturnType<typeof loadProjectInMemory>>
