import { Button } from "#src/pages/index/components/Button.jsx"
import type { HCaptchaFunctions, HCaptchaExecuteResponse } from "solid-hcaptcha"
import { publicEnv } from "@inlang/env-variables"

import HCaptcha from "solid-hcaptcha"
import { Show } from "solid-js"
import * as m from "../../paraglide/messages.js"

export default function Captcha(props: {
	captchaResponse: () => HCaptchaExecuteResponse | null
	setCaptchaResponse: (response: HCaptchaExecuteResponse | null) => void
}) {
	let hcaptcha: HCaptchaFunctions | undefined

	const submitCaptcha = async () => {
		if (!hcaptcha) return

		const response = await hcaptcha.execute()

		// eslint-disable-next-line unicorn/no-null
		props.setCaptchaResponse(response || null)
	}

	return (
		<div class={props.captchaResponse() ? "pointer-events-none opacity-50 cursor-default" : ""}>
			<Show when={typeof window !== "undefined"}>
				<HCaptcha
					sitekey={publicEnv.PUBLIC_HCAPTCHA_SITEKEY}
					onLoad={(hcaptcha_instance) => (hcaptcha = hcaptcha_instance)}
					size="invisible"
				/>
			</Show>
			<Button
				function={submitCaptcha}
				type="text"
				class={"text-md" + (props.captchaResponse() ? "pointer-events-none opacity-50" : "")}
			>
				{props.captchaResponse() ? m.newsletter_captcha_submitted() : m.newsletter_captcha_submit()}
			</Button>
		</div>
	)
}
