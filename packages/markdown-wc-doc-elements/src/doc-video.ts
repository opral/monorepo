import { LitElement, html, css } from "lit"

export default class DocVideo extends LitElement {
	static override styles = css`
		.doc-video {
			width: 100%;
			height: auto;
		}
		.doc-video {
			width: 100% !important;
			height: auto !important;
			border-radius: 8px;
			border: 1px solid #e0e0e0;
		}

		.youtube-video {
			aspect-ratio: 16 / 9;
			width: 100%;
		}
	`
	static override properties = {
		src: { type: String },
	}

	src!: string

	override render() {
		const player = this.getPlayer()
		console.log({ player })
		if (player === "youtube") {
			const youtubeUrl = this.getYouTubeEmbedUrl(this.src)
			return html`<iframe
				class="youtube-video"
				src="${youtubeUrl}"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			></iframe>`
		} else if (player === "loom") {
			// it is common to receive a share link, so we convert it to an embed link
			const _src = this.src.includes("share") ? this.src.replace("share", "embed") : this.src

			// Add Loom embed logic here if needed
			return html`<div style="position: relative; padding-bottom: 62.5%; height: 0;">
				<iframe
					src="${_src}"
					frameborder="0"
					webkitallowfullscreen
					mozallowfullscreen
					allowfullscreen
					style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
				></iframe>
			</div>`
		} else if (player === "local") {
			return html`<video class="doc-video" controls autoplay muted>
				<source src="${this.src}" type="video/mp4" />
			</video>`
		} else {
			return html`<p>Unsupported video url.</p>`
		}
	}

	getPlayer(): "local" | "youtube" | "loom" | "unknown" {
		if (!this.src?.startsWith("http")) {
			return "local"
		} else {
			const url = new URL(this.src)
			console.log({ url })
			if (url.hostname.includes("youtube") || url.hostname.includes("youtu.be")) {
				return "youtube"
			} else if (url.hostname.includes("loom")) {
				return "loom"
			}
		}
		return "unknown"
	}

	/**
	 * Converts a YouTube video URL to an embed URL.
	 * @param {string} url - The YouTube video URL.
	 * @returns {string} - The YouTube embed URL.
	 */
	getYouTubeEmbedUrl(url: string): string {
		const videoId = this.extractYouTubeVideoId(url)
		return `https://www.youtube.com/embed/${videoId}`
	}

	/**
	 * Extracts the video ID from a YouTube URL.
	 * @param {string} url - The YouTube video URL.
	 * @returns {string} - The YouTube video ID.
	 */
	extractYouTubeVideoId(url: string): string {
		const urlObj = new URL(url)
		if (urlObj.hostname === "youtu.be") {
			return urlObj.pathname.slice(1)
		} else if (urlObj.hostname === "youtube.com") {
			return urlObj.searchParams.get("v") || ""
		}
		return ""
	}
}

customElements.define("doc-video", DocVideo)
