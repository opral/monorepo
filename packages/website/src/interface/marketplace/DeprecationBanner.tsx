import { registry } from "@inlang/marketplace-registry";
import * as m from "#src/paraglide/messages.js";

interface DeprecationBannerProps {
	manifest: (typeof registry)[number];
}

export const DeprecationBanner = (props: DeprecationBannerProps) => {
	// Check if the item is deprecated
	const isDeprecated = (props.manifest as any).deprecated === true;

	if (!isDeprecated) {
		return null;
	}

	// Get the deprecation message if available
	const deprecatedMessage =
		(props.manifest as any).deprecatedMessage?.en ||
		(m.deprecated_item_default_message
			? m.deprecated_item_default_message()
			: "This item has been deprecated and is no longer actively maintained. It remains accessible for existing users but may be removed in the future.");

	return (
		<div class="w-full bg-warning-100 border-l-4 border-warning-500 p-4 mb-6">
			<div class="flex items-start">
				<div class="flex-shrink-0">
					<svg
						class="h-5 w-5 text-warning-500"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-warning-800">
						{m.deprecated_item_title
							? m.deprecated_item_title()
							: "Deprecated Item"}
					</h3>
					<div class="mt-2 text-sm text-warning-700">
						<p>{deprecatedMessage}</p>
					</div>
				</div>
			</div>
		</div>
	);
};
