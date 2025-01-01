import path from "node:path"

export async function closestInlangProject(args: {
	workingDirectory: string
	projects: { projectPath: string }[]
}): Promise<{ projectPath: string } | undefined> {
	if (args.workingDirectory === "" || args.projects.length === 0) {
		return undefined // No working directory specified or no projects
	}

	// Function to calculate the distance between two paths
	const calculateDistance = (from: string, to: string): number => {
		const relativePath = path.relative(from, to)
		// Check if the project is a subdirectory of the working directory
		if (!relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
			return relativePath.split(path.sep).length
		}
		return Infinity // Return a large distance for non-subdirectories
	}

	// Find the project with the minimum distance to the working directory
	let closestProject = undefined
	let minDistance = Infinity

	for (const project of args.projects) {
		const distance = calculateDistance(args.workingDirectory, project.projectPath)
		if (distance < minDistance) {
			minDistance = distance
			closestProject = project
		}
	}

	return closestProject
}
