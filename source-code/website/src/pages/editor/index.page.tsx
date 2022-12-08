import { clientSideEnv } from "@env";
import { LoginDialog } from "@src/services/auth/LoginDialog.jsx";
import { useLocalStorage } from "@src/services/local-storage/LocalStorageProvider.jsx";
import { Layout as EditorLayout } from "./Layout.jsx";

const env = clientSideEnv();

export function Page() {
	const [localStorage] = useLocalStorage();

	return (
		<EditorLayout>
			<p>open a repository</p>
			<a class="link link-primary" href="/editor/github.com/inlang/demo">
				example
			</a>
			<p>hi {localStorage.user?.username}</p>
			<LoginDialog
				githubAppClientId={env.VITE_GITHUB_APP_CLIENT_ID}
			></LoginDialog>
		</EditorLayout>
	);
}
