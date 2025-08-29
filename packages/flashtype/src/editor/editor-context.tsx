import * as React from "react";

type EditorContextValue = {
	editor: any | null;
	setEditor: (editor: any | null) => void;
};

const Ctx = React.createContext<EditorContextValue | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
	const [editor, setEditor] = React.useState<any | null>(null);
	const value = React.useMemo(() => ({ editor, setEditor }), [editor]);
	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEditorCtx() {
	const ctx = React.useContext(Ctx);
	if (!ctx)
		throw new Error("useEditorCtx must be used within <EditorProvider>");
	return ctx;
}
