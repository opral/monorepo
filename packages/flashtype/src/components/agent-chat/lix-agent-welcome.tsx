import * as React from "react";

/**
 * Boxed welcome screen for the Lix Agent (empty state).
 * Light-blue ASCII banner inspired by the LIX mark: tall pillars + X,
 * with an "i" overline that stretches toward the X.
 */
export function LixAgentWelcome() {
	const lixBlue = "#07B6D4";
	return (
		<div className="pt-2 pb-3">
			<div className="rounded-md border" style={{ borderColor: lixBlue }}>
				<div className="px-4 py-3">
					<div className="font-mono text-sm leading-6 flex items-center font-semibold">
						<span>Welcome to the </span>
						<span className="inline-flex items-center ml-2 mb-0.5">
							<LixMark className="inline-block h-5.5 w-5.5" />
							<span className="sr-only">Lix</span>
						</span>
						<span className="ml-1 font-semibold" style={{ color: lixBlue }}>
							Agent
						</span>
						<span>.</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function LixMark({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 128 128"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
		>
			<path
				d="M70.8478 50.6263L79.7495 67.5774L102.206 28.4037H116L88.6196 74.8692L103.045 99.1121H89.314L79.7495 82.3504L70.3428 99.1121H56.4536L70.8478 74.8692L56.9587 50.6263H70.8478Z"
				fill="#07B6D4"
			/>
			<path
				d="M35.3909 99.1119V50.6262H48.8381V99.1119H35.3909Z"
				fill="#07B6D4"
			/>
			<path
				d="M24.5052 28.5492V99.6616H11.1716V28.5492H24.5052Z"
				fill="#07B6D4"
			/>
			<path
				d="M35.6166 28.5492H71.1728V39.6605H35.6166V28.5492Z"
				fill="#07B6D4"
			/>
		</svg>
	);
}
