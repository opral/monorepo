import { clientSideEnv } from "@env";
import { useLocalStorage } from "@src/services/local-storage/LocalStorageProvider.jsx";
import { Layout as EditorLayout } from "./Layout.jsx";

export function Page() {
	const [localStorage] = useLocalStorage();

	return (
		<EditorLayout>
			<p>open a repository</p>
			<a class="link link-primary" href="/editor/github.com/inlang/demo">
				example
			</a>
		</EditorLayout>
	);
}
