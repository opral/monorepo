import { onMount } from "solid-js"
import IconGithub from "~icons/cib/github"
import type { SlDialog } from "@shoelace-style/shoelace"
import { SignInDialog } from "#src/services/auth/index.js"
import { publicEnv } from "@inlang/env-variables"

export const Gitlogin = () => {
	let signInDialog: SlDialog | undefined

	function onSignIn() {
		signInDialog?.show()
	}

	onMount(() => {
		const gitfloat = document.querySelector(".gitfloat")
		gitfloat?.classList.add("animate-slideIn")
		setTimeout(() => {
			gitfloat?.classList.remove("animate-slideIn")
		}, 400)
	})

	return (
		<>
			<div class="flex justify-start items-center">
				<sl-button
					prop:size="medium"
					onClick={() => {
						return onSignIn()
					}}
					class={"on-inverted"}
				>
					<div slot="prefix">
						<IconGithub />
					</div>
					Login
				</sl-button>
			</div>
			<SignInDialog
				githubAppClientId={publicEnv.PUBLIC_GITHUB_APP_CLIENT_ID}
				ref={signInDialog!}
				onClickOnSignInButton={() => {
					signInDialog?.hide()
				}}
			/>
		</>
	)
}
