import { Type, type Static } from "@sinclair/typebox"

const GitHubActionStep = Type.Object({
	name: Type.Optional(Type.String()),
	id: Type.Optional(Type.String()),
	uses: Type.Optional(Type.String()),
	with: Type.Optional(Type.Record(Type.String(), Type.Any())),
	env: Type.Optional(Type.Record(Type.String(), Type.Any())),
})

const GitHubActionJob = Type.Object({
	name: Type.Optional(Type.String()),
	"runs-on": Type.String(),
	steps: Type.Array(GitHubActionStep),
})

const GitHubActionEvent = Type.Union([
	Type.Literal("pull_request_target"),
	Type.Object({
		pull_request_target: Type.Optional(Type.Any()),
		// Define other events as necessary, ensuring correct property names
	}),
])

export const GitHubActionsWorkflow = Type.Object({
	name: Type.String(),
	on: GitHubActionEvent,
	jobs: Type.Record(Type.String(), GitHubActionJob),
	// Use Record to define an object with string keys and GitHubActionJob values
})

// Example usage
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ninjaI18nWorkflow: Static<typeof GitHubActionsWorkflow> = {
	name: "Ninja i18n action",
	on: "pull_request_target",
	jobs: {
		"ninja-i18n": {
			name: "Ninja i18n - GitHub Lint Action",
			"runs-on": "ubuntu-latest",
			steps: [
				{
					name: "Run Ninja i18n",
					id: "ninja-i18n",
					uses: "opral/ninja-i18n-action@main",
					env: {
						GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
					},
				},
			],
		},
	},
}
