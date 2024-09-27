import { useAtom } from "jotai";
import { SetStateAction, useMemo, useState } from "react";
import { selectedProjectPathAtom } from "../../state.ts";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { newProject } from "@inlang/sdk2";
import { SlButton, SlDialog, SlInput } from "@shoelace-style/shoelace/dist/react";


export const CreateProjectDialog = (props: {
  showNewProjectDialog: boolean;
  setShowNewProjectDialog: React.Dispatch<SetStateAction<boolean>>;
}) => {
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const isValid = useMemo(() => fileName.endsWith(".inlang"), [fileName]);
  const [, setSelectedProjectPath] = useAtom(selectedProjectPathAtom);

  const handleCreateNewProject = async () => {
    setLoading(true);

    const rootHandle = await getOriginPrivateDirectory();
    const fileHandle = await rootHandle.getFileHandle(fileName, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    const file = await newProject();
    await writable.write(file);
    await writable.close();
    setLoading(false);
    props.setShowNewProjectDialog(false);
    setSelectedProjectPath(fileName);
  };

  return (
    <SlDialog
      label="Create new project"
      open={props.showNewProjectDialog}
      onSlRequestClose={() => props.setShowNewProjectDialog(false)}
    >
      <SlInput
        autoFocus
        label="Filename"
        helpText={
          fileName
            ? `Create project file ${fileName}`
            : "Enter the name of your inlang file"
        }
        placeholder="my-website"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onInput={(e: any) =>
          setFileName(e.target.value ? e.target.value + ".inlang" : "")
        }
      ></SlInput>
      <SlButton
        loading={loading}
        variant="primary"
        disabled={!isValid}
        slot="footer"
        onClick={handleCreateNewProject}
      >
        Create project
      </SlButton>
    </SlDialog>
  );
};

export default CreateProjectDialog;