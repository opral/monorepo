import "./array-input.js"
import type { Meta, StoryObj } from "@storybook/web-components"

const meta: Meta = {
	component: "array-input",
	title: "Private/input/array",
	tags: ["autodocs"],
	argTypes: {
		property: { type: "string" },
		value: { control: { type: "array" } },
		schema: { control: { type: "object" } },
		moduleId: { type: "string" },
	},
}

export default meta

export const Default: StoryObj = {
	args: {
		property: "test proptery",
		value: ["test string", "next string"],
		schema: {
			type: "array",
			items: {
				pattern: undefined,
			},
			description: "This is a description",
		},
	},
}

export const LanguageTag: StoryObj = {
	args: {
		property: "languageTags",
		value: ["en", "de"],
		schema: {
			type: "array",
			items: {
				pattern:
					"^((?<grandfathered>(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?<language>([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?))(-(?<script>[A-Za-z]{4}))?(-(?<region>[A-Za-z]{2}|[0-9]{3}))?(-(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*))$",
			},
			description: "This is a description",
		},
	},
}

export const ReferencePattern: StoryObj = {
	args: {
		property: "variableReferencePattern",
		value: ["{", "}"],
		schema: {
			type: "array",
			items: {
				type: "string",
			},
		},
	},
}
