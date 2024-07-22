import { html } from "lit"

function Component() {
	let bundle: any

	// 	return html`

	//   <inlang-bundle-root .bundle=${bundle} @change=${updateBundle}>
	//     <inlang-bundle-editor-action slot="bundle-action">
	//     <inlang-bundle-editor-action slot="message-action">
	//     <inlang-bundle-editor-action slot="bundle-action">
	//   </inlang-bundle-editor>

	// 	`

	// const render = html`
	//     <inlang-bundle-editor>
	//           <inlang-bundle-editor-header>
	//           ${bundle.messages.map(
	//             (message) => html`
	//             <inlang-editor-message .message=${message}>
	//               ${message.variants.map(variant) => html`
	//                 <inlang-editor-variant .variant=${variant}>
	//                   <inlang-editor-variant-action new @click=${()}>
	//                     Machine Translate
	//                   </inlang-editor-variant-action>
	//                   <inlang-editor-pattern .pattern=${variant.pattern} @change=${(pattern) => {
	//                     console.log(`${message.id}, ${variant.id}, ${pattern}`)
	//                   }}></inlang-editor-pattern>
	//                 </inlang-editor-variant>
	//               `}
	//             </inlang-editor-message>
	//             `
	//       )}
	// 		</inlang-editor-bundle>

	// `

	return html` <inlang-message-bundle @change-message-bundle=${() => {}}>
		<inlang-message-bundle-header .bundle=${bundle}>
			<inlang-message-bundle-action slot="bundle-action"></inlang-message-bundle-action>
			<inlang-message-bundle-action slot="bundle-action"></inlang-message-bundle-action>
		</inlang-message-bundle-header>
		${bundle.messages.map(
			(message: any) => html`
				<inlang-message .message=${message}>
					${message.variants.map(
						(variant: any) => html`
							<inlang-variant .variant=${variant}>
								<inlang-variant-action
									name="machine translate"
									slot="variant-action"
									@click=${() => {}}
								></inlang-variant-action>
								<inlang-pattern-editor
									.messageId=${message.id}
									.variantId=${variant.id}
									.pattern=${variant.pattern}
								></inlang-pattern-editor>
							</inlang-variant>
						`
					)}
				</inlang-message>
			`
		)}
	</inlang-message-bundle>`
}

const render = html` <inlang-message-bundle @change-message-bundle=${() => {}}>
	<inlang-message-bundle-header .bundle=${bundle}></inlang-message-bundle-header>
	${bundle.messages.map(
		(message: any) => html`
			<inlang-message .settings=${settings} .filteredLocales=${filteredLocales} .message=${message}>
				${message.variants.map(
					(variant: any) => html`
						<inlang-variant .variant=${variant}>
							<inlang-pattern-editor evenet .pattern=${variant.pattern}></inlang-pattern-editor>
						</inlang-variant>
					`
				)}
			</inlang-message>
		`
	)}
</inlang-message-bundle>`
