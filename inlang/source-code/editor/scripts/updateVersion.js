import { execSync } from "node:child_process";
import fs from "node:fs";

// Function to execute shell commands
function execCommand(command) {
  try {
    return execSync(command).toString();
  } catch (error) {
    console.error(`Error executing command: ${command}`, error);
    return undefined;
  }
}

// Function to update the version.json file
function updateVersionFile() {
  // Fetch package versions
  const pnpmOutput = execCommand("pnpm m ls --depth -1 --json");
  if (!pnpmOutput) return;

  const packages = JSON.parse(pnpmOutput);
  const editorVersion = packages.find(
    (pkg) => pkg.name === "@inlang/editor",
  ).version;
  const inlangVersion = packages.find(
    (pkg) => pkg.name === "@inlang/sdk",
  ).version;
  const lixVersion = packages.find(
    (pkg) => pkg.name === "@lix-js/client",
  ).version;
  // if working directory is not clean set commit hash to "dev"
  const gitStatus = execCommand("git status --porcelain");
  const commitHash = gitStatus
    ? "dev"
    : execCommand("git rev-parse HEAD").trim();

  // Read the current version.json
  const versionFilePath = "./version.json";
  // Create version.json if it does not exist
  if (!fs.existsSync(versionFilePath)) {
    fs.writeFileSync(
      versionFilePath,
      `{
				"@inlang/editor": "",
				"commit-hash": "",
				"@inlang/sdk": "",
				"@lix-js/client": ""
			}
			`,
    );
  }
  const versionFile = JSON.parse(fs.readFileSync(versionFilePath));

  // Update version.json file
  versionFile["@inlang/editor"] = editorVersion;
  versionFile["commit-hash"] = commitHash;
  versionFile["@inlang/sdk"] = inlangVersion;
  versionFile["@lix-js/client"] = lixVersion;

  // Write the updated version.json
  fs.writeFileSync(versionFilePath, JSON.stringify(versionFile, undefined, 2));
}

// Execute the update
updateVersionFile();
