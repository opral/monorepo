interface EditButtonProps {
	href: string | undefined
}

export function EditButton(props: EditButtonProps) {
	return (
		<div class="md:pl-9 w-full pt-8 sm:pt-12 max-sm:pb-8">
			<a
				href={props.href}
				class="text-info/80 hover:text-info/100 text-sm font-semibold"
				target="_blank"
			>
				Edit on GitHub
			</a>
		</div>
	)
}
