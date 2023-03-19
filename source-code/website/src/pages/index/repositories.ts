/**
 * Showcased repositories that are using inlang.
 *
 * If you want to showcase your repository, edit the following
 * list and add your repository below.
 */
export const repositories: Repositories = [
	{
		owner: "inlang",
		repository: "example",
		description: "Example repository that showcases inlang.",
	},
	{
		owner: "jazzband",
		repository: "djangorestframework-simplejwt",
		description: "A JSON Web Token authentication plugin for the Django REST Framework.",
	},
	{
		owner: "osmosis-labs",
		repository: "osmosis-frontend",
		description: "Web interface for Osmosis Zone",
	},
	{
		owner: "allinurl",
		repository: "goaccess",
		description: "GoAccess is a real-time web log analyzer and interactive viewer",
	},
	{
		owner: "knadh",
		repository: "listmonk",
		description: "High performance, self-hosted, newsletter and mailing list manager with a modern dashboard. Single binary app.",
	},
]

type Repositories = Array<{
	owner: string
	repository: string
	description: string
}>
