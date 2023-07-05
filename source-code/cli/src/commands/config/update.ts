import fs from "node:fs"
import { Command } from "commander"
import path from "node:path"
import { cli } from "../../main.js"
import { log } from "../../utilities.js"
import { getLatestVersion } from "../../utilities/getLatestVersion.js"
import prompts from "prompts"
import { bold, italic } from "../../utilities/format.js"

const configFile = "inlang.config.js"

export const update = new Command()
	.command("update")
	.description("Update the inlang config.")
	.action(updateCommandAction)

async function updateCommandAction() {
	try {
		const answer = await prompts({
			type: "confirm",
			name: "update",
			message:
				"This command will update the plugins in you config file to the latest major version. Updating to a new major version can break the code, please look into the docs of the plugins you are using to see if there are breaking changes. Do you want to continue?",
			initial: true,
		})
		if (answer.update === false) {
			log.info("Aborting.")
			return
		}
		log.info("Checking for new plugin versions...")
		const filePath = cli.opts().config
			? path.resolve(process.cwd(), cli.opts().config)
			: path.resolve(process.cwd(), configFile)

		const config = await readConfigFile(filePath)

		// get the urls of the used plugins from the config file
		const pluginURLs = extractPluginUrls(config)

		// parse the urls
		const pluginURLsParsed = pluginURLs.map((url) => {
			const cleanedUrl = url.replace(/^"(.*)"$/, "$1") // Remove leading and trailing double quotes
			const urlParts = cleanedUrl.split("/")
			const nameWithVersion = urlParts[5]!
			const [name, version] = nameWithVersion.split("@")
			const publisher = urlParts[4]
			return {
				publisher: publisher,
				name,
				url: cleanedUrl,
				version,
			}
		})

		// get the latest version of each plugin
		const pluginURLsWithLatestVersion = await Promise.all(
			pluginURLsParsed.map(async (pluginURL) => {
				const latestVersion = await getLatestVersion(pluginURL.publisher + "/" + pluginURL.name!)
				return {
					...pluginURL,
					latestVersion,
				}
			}),
		)

		// for each  version, log which current version and which latest version will be used
		for (const pluginURL of pluginURLsWithLatestVersion) {
			log.info(
				`📦 ${bold(`${pluginURL.publisher}/${pluginURL.name}`)} will be updated from v${italic(
					`${pluginURL.version}`,
				)} to v${italic(`${pluginURL.latestVersion}`)}`,
			)
		}

		// add the latest version to the plugin urls
		const pluginURLsWithUpdatedVersion = pluginURLsWithLatestVersion.map((pluginURL) => {
			const updatedURL = updatePluginVersion(pluginURL.url, pluginURL.latestVersion!)
			return {
				...pluginURL,
				updatedURL,
			}
		})

		// replace the old urls with the new ones
		const updatedConfig = pluginURLsWithUpdatedVersion.reduce((acc, pluginURL) => {
			return acc.replace(pluginURL.url, pluginURL.updatedURL)
		}, config)

		// write the updated config file
		await writeFile(filePath, updatedConfig)

		log.success(`🎉 ${configFile} updated successfully.`)
	} catch (err) {
		log.error("❌ Failed to update plugin versions:", err)
	}
}

function readConfigFile(filePath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, "utf8", (err, data) => {
			if (err) {
				reject(err)
				return
			}
			try {
				resolve(data)
			} catch (err) {
				reject(err)
			}
		})
	})
}

function extractPluginUrls(code: string): string[] {
	const urlRegex = /"(https?:\/\/.*?)(?=")/g
	return [...code.matchAll(urlRegex)].map((match) => match[0]).map((url) => url.replace(/^"/, ""))
}

function updatePluginVersion(url: string, newVersion: string): string {
	const versionRegex = /(@[\w.-]+)(?=\/dist\/index.js)/
	return url.replace(versionRegex, `@${newVersion}`)
}

function writeFile(filePath: string, data: string): Promise<void> {
	return new Promise((resolve, reject) => {
		fs.writeFile(filePath, data, (err) => {
			if (err) {
				reject(err)
				return
			}
			resolve()
		})
	})
}
