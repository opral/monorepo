import nodePath from "node:path";
import type fs from "node:fs/promises";

export type ProjectMeta = {
	highestSdkVersion?: string;
};

export async function readProjectMeta(args: {
	fs: typeof fs;
	projectPath: string;
}): Promise<ProjectMeta | undefined> {
	try {
		const raw = await args.fs.readFile(
			nodePath.join(args.projectPath, ".meta.json"),
			"utf8"
		);
		const parsed = JSON.parse(raw) as ProjectMeta;
		return parsed && typeof parsed === "object" ? parsed : undefined;
	} catch {
		return undefined;
	}
}

export function pickHighestVersion(
	versions: Array<string | undefined>
): string | undefined {
	let highest: string | undefined;
	for (const version of versions) {
		if (!version || parseSemver(version) === null) {
			continue;
		}
		if (!highest) {
			highest = version;
			continue;
		}
		const comparison = compareSemver(highest, version);
		if (comparison !== null && comparison < 0) {
			highest = version;
		}
	}
	return highest;
}

export function compareSemver(left: string, right: string): number | null {
	const leftParts = parseSemver(left);
	const rightParts = parseSemver(right);
	if (!leftParts || !rightParts) {
		return null;
	}
	const [leftMajor, leftMinor, leftPatch] = leftParts;
	const [rightMajor, rightMinor, rightPatch] = rightParts;
	const deltaMajor = leftMajor - rightMajor;
	if (deltaMajor !== 0) return deltaMajor;
	const deltaMinor = leftMinor - rightMinor;
	if (deltaMinor !== 0) return deltaMinor;
	const deltaPatch = leftPatch - rightPatch;
	if (deltaPatch !== 0) return deltaPatch;
	return 0;
}

function parseSemver(version: string): [number, number, number] | null {
	if (!version) {
		return null;
	}
	const core = version.split("-")[0];
	if (!core) {
		return null;
	}
	const parts = core.split(".");
	if (!parts[0]) {
		return null;
	}
	const major = Number(parts[0]);
	const minor = Number(parts[1] ?? "0");
	const patch = Number(parts[2] ?? "0");
	if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) {
		return null;
	}
	return [major, minor, patch];
}
