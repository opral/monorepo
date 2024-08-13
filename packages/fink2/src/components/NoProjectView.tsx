import { CreateNewProject } from "../layout.tsx";

const NoProjectView = () => {
	return (
		<div className="flex flex-col items-center justify-center h-full gap-8 mt-32">
			<svg
				width="44"
				height="44"
				viewBox="0 0 44 44"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<g clipPath="url(#clip0_1090_10128)">
					<path
						d="M7.85993 15.7171V4.71708C7.85993 3.88354 8.19105 3.08414 8.78045 2.49474C9.36985 1.90534 10.1693 1.57422 11.0028 1.57422H31.4314L42.4314 12.5742V39.2885C42.4314 40.122 42.1002 40.9214 41.5108 41.5108C40.9214 42.1002 40.122 42.4314 39.2885 42.4314H23.5742M11.0028 23.5742V42.4314M1.57422 33.0028H20.4314"
						stroke="currentColor"
						strokeWidth="2.51429"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</g>
				<defs>
					<clipPath id="clip0_1090_10128">
						<rect width="44" height="44" fill="white" />
					</clipPath>
				</defs>
			</svg>
			<div className="flex flex-col gap-2 text-center">
				<h2 className="text-lg font-medium text-gray-900">No project</h2>
				<p className="text-gray-600">Get started by creating a new project.</p>
			</div>
			<CreateNewProject size="large" />
		</div>
	);
};

export default NoProjectView;
