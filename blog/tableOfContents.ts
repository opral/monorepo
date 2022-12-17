type Shema = {
	[id: string]: {
		/** filePath: "./number-folder-name/index.md" */
		filePath: string;
		/** Headline on the blog page overview */
		headline: string;
		subHeadline: string;
		previewImageSrc: string;
	};
};
/**
 * is the content of the documentation site  Sidenav
 */
export const tableOfContents: Shema = {
	"git-as-backend": {
		filePath: "./001-git-as-backend/index.md",
		headline: "8123123 muss ich sehen",
		subHeadline: "Introduction",
		previewImageSrc:
			"https://p.bigstockphoto.com/GeFvQkBbSLaMdpKXF1Zv_bigstock-Aerial-View-Of-Blue-Lakes-And--227291596.jpg",
	},
};
