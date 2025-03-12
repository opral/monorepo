import { Button } from "#src/pages/index/components/Button.jsx";
import * as m from "#src/paraglide/messages.js";

const PluginHeader = () => {
	return (
		<>
			<div class="relative bg-surface-100 overflow-hidden rounded-xl border border-surface-200 flex flex-col md:flex-row items-center text-center md:text-start py-4 px-6 mb-8 gap-4">
				<div class="w-10 h-10">
					<GuideIcon />
				</div>
				<div class="relative z-30 flex-1 flex flex-col items-center md:items-start gap-1 ">
					<h2 class="font-medium text-md w-fit">
						{m.marketplace_header_plugin_toast_title()}
					</h2>
					<p class="md:w-1/2 text-sm text-surface-500">
						{m.marketplace_header_plugin_toast_description()}
					</p>
				</div>
				<Button
					type="secondaryOnGray"
					target="_blank"
					href="https://github.com/opral/inlang-sdk#plugins"
				>
					{m.marketplace_header_plugin_toast_button_text()}
				</Button>
			</div>
		</>
	);
};

export default PluginHeader;

function GuideIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="100%"
			fill="none"
			viewBox="0 0 256 256"
		>
			<path
				fill="#000"
				d="M210.78 39.25l-130.25-23A16 16 0 0062 29.23l-29.75 169a16 16 0 0013 18.53l130.25 23a16.002 16.002 0 0018.54-13l29.75-169a16.003 16.003 0 00-13.01-18.51zM178.26 224L48 201 77.75 32 208 55l-29.74 169zM89.34 58.42a8 8 0 019.27-6.48l83 14.65a8.002 8.002 0 016.589 8.578 8 8 0 01-7.979 7.302c-.469 0-.938-.04-1.4-.12l-83-14.66a8 8 0 01-6.48-9.27zM83.8 89.94a8.001 8.001 0 019.27-6.49l83 14.66a8.003 8.003 0 016.649 8.593A7.998 7.998 0 01174.67 114a7.58 7.58 0 01-1.41-.13l-83-14.65a8 8 0 01-6.46-9.28zm-5.55 31.51a8 8 0 019.27-6.45l41.48 7.29a7.994 7.994 0 014.962 3.005 8.001 8.001 0 01-7.742 12.755l-41.5-7.33a8.001 8.001 0 01-6.47-9.27z"
			/>
		</svg>
	);
}
