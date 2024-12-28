import { SlButton, SlDialog, SlInput } from "@shoelace-style/shoelace/dist/react";
import { SetStateAction, useState } from "react";
import { projectAtom, settingsAtom } from "../../state.ts";
import { useAtom } from "jotai";
import { handleImportedFile } from "../../helper/utils.ts";
import { supportedPluginKeyType } from "../../helper/types.ts";

const ImportLocaleDialog = (props: {
	importedFile: File | undefined;
	setImportedFile: React.Dispatch<SetStateAction<File | undefined>>;
	importPlugin: supportedPluginKeyType | undefined;
	setImportPlugin: React.Dispatch<
		React.SetStateAction<supportedPluginKeyType | undefined>
	>;
}) => {
	const [project] = useAtom(projectAtom);
	const [settings] = useAtom(settingsAtom);
	const [locale, setLocale] = useState("");

	const handleSubmit = async () => {
		if (props.importedFile && props.importPlugin && locale) {
			handleImportedFile(project, props.importedFile, locale, props.importPlugin);
			// add locale to settings if not already present
			if (!settings.locales.includes(locale)) {
				project!.settings.set({
					...settings,
					locales: [...settings.locales, locale],
				});
			}
			setLocale("");
			props.setImportedFile(undefined);
			props.setImportPlugin(undefined);
		}
	};

	return (
		<>
			{props.importedFile && props.importPlugin && (
				<SlDialog
					label="Imported locale (IETF language tag)"
					open={props.importedFile !== undefined}
					onSlRequestClose={() => {
						setLocale("");
						props.setImportedFile(undefined);
					}}
				>
					<SlInput
						autoFocus
						label="Locale"
						helpText="Enter the valid IETF language tag for the imported file."
						placeholder="en, en-US, zh-Hans, ..."
						value={locale}
						// @ts-expect-error - shoelace event type
						onInput={(e) => setLocale(e.target.value)}
					></SlInput>
					<SlButton variant="primary" slot="footer" onClick={() => handleSubmit()}>
						Import
					</SlButton>
				</SlDialog>
			)}
		</>
	);
};

export default ImportLocaleDialog;
