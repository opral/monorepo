import { version } from "../../package.json";

const Footer = () => {
	const socialMediaLinks = [
		{
			name: "Twitter",
			href: "https://twitter.com/finkEditor",
			Icon: IconX,
			screenreader: "Twitter Profile",
		},
		{
			name: "GitHub",
			href: "https://github.com/opral/inlang",
			Icon: IconGitHub,
			screenreader: "GitHub Repository",
		},
		{
			name: "Discord",
			href: "https://discord.gg/gdMPPWy57R",
			Icon: IconDiscord,
			screenreader: "Discord Server",
		},
	];

	return (
		<footer className="bg-background border-t border-zinc-200 py-4 px-4 overflow-visible">
			<div className="max-w-7xl mx-auto flex justify-between gap-4 xl:px-4 h-6">
				<div className="flex items-center justify-between w-24">
					<p className="text-sm text-zinc-500">
						© {new Date().getFullYear().toString()} Opral
					</p>
				</div>
				<div className="flex gap-4">
					{socialMediaLinks.map((link) => (
						<a
							key={link.name}
							target="_blank"
							className={"link link-primary flex space-x-2 items-center text-xs"}
							href={link.href}
						>
							<link.Icon />
							<span className="sr-only">{link.name}</span>
						</a>
					))}
				</div>
				<div className="flex items-center justify-end w-24 text-sm text-zinc-500">
					v{version}
				</div>
			</div>
		</footer>
	);
};

export default Footer;

export function IconX() {
	return (
		<svg
			className="w-5 h-5 hover:text-blue-700"
			width="19"
			height="19"
			viewBox="0 0 24 23"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M18.8782 0.660156H22.5582L14.4782 9.86016L23.9182 22.3402H16.5102L10.7102 14.7562L4.07016 22.3402H0.390156L8.95016 12.5002L-0.0898438 0.660156H7.50216L12.7422 7.58816L18.8782 0.660156ZM17.5902 20.1802H19.6302L6.43016 2.74016H4.23816L17.5902 20.1802Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function IconGitHub() {
	return (
		<svg
			className="w-5 h-5 hover:text-blue-700"
			width="1.2em"
			height="1.2em"
			viewBox="0 0 32 32"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M16 .396c-8.839 0-16 7.167-16 16c0 7.073 4.584 13.068 10.937 15.183c.803.151 1.093-.344 1.093-.772c0-.38-.009-1.385-.015-2.719c-4.453.964-5.391-2.151-5.391-2.151c-.729-1.844-1.781-2.339-1.781-2.339c-1.448-.989.115-.968.115-.968c1.604.109 2.448 1.645 2.448 1.645c1.427 2.448 3.744 1.74 4.661 1.328c.14-1.031.557-1.74 1.011-2.135c-3.552-.401-7.287-1.776-7.287-7.907c0-1.751.62-3.177 1.645-4.297c-.177-.401-.719-2.031.141-4.235c0 0 1.339-.427 4.4 1.641a15.436 15.436 0 0 1 4-.541c1.36.009 2.719.187 4 .541c3.043-2.068 4.381-1.641 4.381-1.641c.859 2.204.317 3.833.161 4.235c1.015 1.12 1.635 2.547 1.635 4.297c0 6.145-3.74 7.5-7.296 7.891c.556.479 1.077 1.464 1.077 2.959c0 2.14-.02 3.864-.02 4.385c0 .416.28.916 1.104.755c6.4-2.093 10.979-8.093 10.979-15.156c0-8.833-7.161-16-16-16z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function IconDiscord() {
	return (
		<svg
			className="w-5 h-5 hover:text-blue-700"
			viewBox="0 0 32 32"
			width="1.2em"
			height="1.2em"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fill="currentColor"
				d="M26.964 0c1.875 0 3.385 1.516 3.474 3.302V32l-3.568-3.031l-1.958-1.781l-2.141-1.865l.891 2.938H4.948c-1.87 0-3.385-1.417-3.385-3.302V3.308c0-1.786 1.516-3.302 3.391-3.302h22zm-8.157 7.578h-.042l-.271.266c2.766.802 4.104 2.052 4.104 2.052c-1.781-.891-3.391-1.339-4.995-1.521c-1.156-.177-2.318-.083-3.297 0h-.271c-.625 0-1.958.271-3.745.984c-.62.271-.979.448-.979.448s1.333-1.339 4.281-2.052l-.182-.177s-2.229-.089-4.635 1.693c0 0-2.406 4.193-2.406 9.359c0 0 1.333 2.318 4.99 2.406c0 0 .536-.708 1.073-1.333c-2.052-.625-2.854-1.875-2.854-1.875s.182.089.448.266h.078c.042 0 .063.021.083.042v.01c.021.021.042.036.078.036c.443.182.88.359 1.24.536c.625.266 1.422.536 2.401.714c1.24.182 2.661.266 4.281 0c.797-.182 1.599-.354 2.401-.714c.516-.266 1.156-.531 1.859-.984c0 0-.797 1.25-2.938 1.875c.438.62 1.057 1.333 1.057 1.333c3.661-.083 5.083-2.401 5.161-2.302c0-5.161-2.422-9.359-2.422-9.359c-2.177-1.62-4.219-1.682-4.578-1.682l.073-.026zm.224 5.886c.938 0 1.693.797 1.693 1.776c0 .99-.76 1.786-1.693 1.786c-.938 0-1.693-.797-1.693-1.776c0-.99.76-1.786 1.693-1.786m-6.057 0c.932 0 1.688.797 1.688 1.776c0 .99-.76 1.786-1.693 1.786c-.938 0-1.698-.797-1.698-1.776c0-.99.76-1.786 1.698-1.786z"
			/>
		</svg>
	);
}
