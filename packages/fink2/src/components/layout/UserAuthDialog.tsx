import { useState } from "react";
import {
  SlInput,
  SlButton,
  SlDialog,
} from "@shoelace-style/shoelace/dist/react";
import { useAtom } from "jotai";
import { authorNameAtom } from "../../state.ts";

const UserAuthDialog = (props: {
  showAuthorDialog: boolean;
  setShowAuthorDialog: (value: boolean) => void;
}) => {
  const [author, setAuthor] = useState("");
  const [, setAuthorName] = useAtom(authorNameAtom);

  const handleSetAuthor = async () => {
    setAuthorName(author);
    props.setShowAuthorDialog(false);
  };

  return (
    <SlDialog
      open={props.showAuthorDialog}
      onSlRequestClose={() => props.setShowAuthorDialog(false)}
      noHeader
    >
      <h2 className="text-lg font-medium pb-2">Set author information</h2>
      <p className="text-sm leading-[1.5]! max-w-[400px] pb-4 text-zinc-500">
        Your author name is appended to your changes and is visible in the
        project history.
      </p>
      <img
        src="/setAuthor.png"
        alt="set author image"
        className="rounded-lg pb-8"
      />
      <SlInput
        autoFocus
        label="Username"
        placeholder="Max Mustermann"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onInput={(e: any) => setAuthor(e.target.value)}
      ></SlInput>
      <SlButton
        variant="primary"
        slot="footer"
        onClick={handleSetAuthor}
        className="w-full"
      >
        Save
      </SlButton>
    </SlDialog>
  );
};

export default UserAuthDialog;