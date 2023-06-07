export type InlangPluginManifest = {
	id: string
	icon: string // url to an icon that can be embedded with <img src={plugin.icon}>
	keywords: string[] // searchable keywords
	repository: string // url, used to embed the readme
	contributorHandle: string // github handle of the contributor
	contributorImage: string // url to the contributor's image can be embedded with <img src={plugin.contributorImage}>
}
