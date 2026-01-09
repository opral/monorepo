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

type ParsedSemver = {
	major: number;
	minor: number;
	patch: number;
	prerelease: string[] | null;
};

export function compareSemver(left: string, right: string): number | null {
	const leftParts = parseSemver(left);
	const rightParts = parseSemver(right);
	if (!leftParts || !rightParts) {
		return null;
	}
	const deltaMajor = leftParts.major - rightParts.major;
	if (deltaMajor !== 0) return deltaMajor;
	const deltaMinor = leftParts.minor - rightParts.minor;
	if (deltaMinor !== 0) return deltaMinor;
	const deltaPatch = leftParts.patch - rightParts.patch;
	if (deltaPatch !== 0) return deltaPatch;
	const leftPre = leftParts.prerelease;
	const rightPre = rightParts.prerelease;
	if (!leftPre && !rightPre) {
		return 0;
	}
	if (!leftPre) {
		return 1;
	}
	if (!rightPre) {
		return -1;
	}
	const max = Math.max(leftPre.length, rightPre.length);
	for (let i = 0; i < max; i += 1) {
		const leftId = leftPre[i];
		const rightId = rightPre[i];
		if (leftId === undefined) {
			return -1;
		}
		if (rightId === undefined) {
			return 1;
		}
		if (leftId === rightId) {
			continue;
		}
		const leftNum = isNumericIdentifier(leftId);
		const rightNum = isNumericIdentifier(rightId);
		if (leftNum && rightNum) {
			const delta = Number(leftId) - Number(rightId);
			if (delta !== 0) return delta;
			continue;
		}
		if (leftNum) {
			return -1;
		}
		if (rightNum) {
			return 1;
		}
		if (leftId < rightId) return -1;
		if (leftId > rightId) return 1;
	}
	return 0;
}

function parseSemver(version: string): ParsedSemver | null {
	if (!version) {
		return null;
	}
	const [core, prereleaseRaw] = version.split("-", 2);
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
	const prerelease = parsePrerelease(prereleaseRaw);
	if (prerelease === null && prereleaseRaw !== undefined) {
		return null;
	}
	return { major, minor, patch, prerelease };
}

function parsePrerelease(raw: string | undefined): string[] | null {
	if (raw === undefined) {
		return null;
	}
	if (raw.length === 0) {
		return null;
	}
	const parts = raw.split(".");
	if (parts.some((part) => part.length === 0)) {
		return null;
	}
	return parts;
}

function isNumericIdentifier(value: string): boolean {
	return /^[0-9]+$/.test(value);
}
