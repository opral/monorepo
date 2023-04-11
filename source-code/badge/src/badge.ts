import satori from "satori"
import { html } from "satori-html"
import { readFileSync } from "node:fs"

// const markup = (url: string) => html`<div style="color: black;">${url}</div>`
const markup = html`<div
	style="display: flex; background-color: navy; height: 300px; width: 300px"
></div>`
// See https://github.com/vercel/satori#documentation

const font = readFileSync(new URL("./assets/static/Inter-Medium.ttf", import.meta.url))

export const badge = async (url: string) => {
	// @ts-ignore
	const image = await satori(markup, {
		width: 300,
		height: 300,
		fonts: [
			{
				family: "Inter",
				weight: 400,
				data: font,
			},
		],
	})

	return image
}
