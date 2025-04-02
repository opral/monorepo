import * as React from "react"
import {
  Download, MoreVertical,
  PenSquare, Trash2, Upload, FileText,
  Plus, ArrowLeft, Folder, FolderOpen
} from "lucide-react"
import { useAtom } from "jotai"
import posthog from "posthog-js"
import { useNavigate } from "react-router-dom"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { availableWorkspacesAtom, filesAtom, lixAtom, withPollingAtom } from "@/state"
import { activeFileAtom } from "@/state-active-file"
import { saveLixToOpfs } from "@/helper/saveLixToOpfs"
import { createNewLixFileInOpfs } from "@/helper/new-lix"
import { updateUrlParams } from "@/helper/updateUrlParams"
import { openLixInMemory, toBlob } from "@lix-js/sdk"

import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/plate-ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/plate-ui/dropdown-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/plate-ui/dialog"
import InfoCard from "../InfoCard"
import { Separator } from "../plate-ui/separator"

// Function to generate a human-readable ID for file names
const generateHumanId = (): string => {
  const adjectives = [
    "happy", "clever", "brave", "bright", "calm", "eager", "gentle", "kind",
    "lively", "neat", "proud", "smart", "swift", "witty", "blue", "green",
    "red", "purple", "orange", "yellow", "teal", "pink", "silver", "golden"
  ];

  const nouns = [
    "apple", "bear", "cat", "dog", "eagle", "fox", "goat", "horse", "iguana",
    "jaguar", "koala", "lion", "mouse", "newt", "owl", "panda", "rabbit",
    "snake", "tiger", "unicorn", "whale", "zebra", "star", "moon", "sun",
    "cloud", "river", "mountain", "forest", "ocean"
  ];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `${randomAdjective}-${randomNoun}-${randomNumber}`;
};

export function WorkspaceSidebar() {
  const [lix] = useAtom(lixAtom)
  const [files] = useAtom(filesAtom)
  const [activeFile] = useAtom(activeFileAtom)
  const [, setPolling] = useAtom(withPollingAtom)
  const [fileToDelete, setFileToDelete] = React.useState<string | null>(null)
  const [showDeleteProjectsDialog, setShowDeleteProjectsDialog] = React.useState(false)
  const [inlineEditingFile, setInlineEditingFile] = React.useState<{ id: string, name: string } | null>(null)
  const [isRenamingWorkspace, setIsRenamingWorkspace] = React.useState(false)
  const [workspaceName, setWorkspaceName] = React.useState('Untitled Workspace')
  const [previousWorkspaceName, setPreviousWorkspaceName] = React.useState('')
  const [availableWorkspaces] = useAtom(availableWorkspacesAtom)
  const inlineInputRef = React.useRef<HTMLInputElement>(null)
  const workspaceInputRef = React.useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const switchToFile = React.useCallback(
    async (fileId: string) => {
      updateUrlParams({ f: fileId })
      setPolling(Date.now())
    },
    [setPolling]
  )

  const createNewFile = React.useCallback(async () => {
    if (!lix) return

    try {
      const fileName = generateHumanId()
      const newFileContent = `Start writing here...`

      const newFile = await lix.db
        .insertInto("file")
        .values({
          path: `/${fileName}.md`,
          data: new TextEncoder().encode(newFileContent),
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      await saveLixToOpfs({ lix })
      updateUrlParams({ f: newFile.id })
      setPolling(Date.now())
    } catch (error) {
      console.error("Failed to create new file:", error)
    }
  }, [lix, setPolling])

  const saveInlineRename = React.useCallback(async () => {
    if (!lix || !inlineEditingFile || !inlineEditingFile.name.trim()) {
      return
    }

    try {
      await lix.db
        .updateTable("file")
        .set({ path: `/${inlineEditingFile.name}.md` })
        .where("id", "=", inlineEditingFile.id)
        .execute()

      await saveLixToOpfs({ lix })
      setPolling(Date.now())
      setInlineEditingFile(null)
    } catch (error) {
      console.error("Failed to rename file:", error)
      setInlineEditingFile(null)
    }
  }, [lix, inlineEditingFile, setPolling])

  const saveWorkspaceName = React.useCallback(async () => {
    if (!lix || !workspaceName.trim()) {
      return
    }

    try {
      // Store the workspace name in the database
      await lix.db
        .insertInto("key_value")
        .values({
          key: "workspace_name",
          value: workspaceName.trim()
        })
        .onConflict((oc) => oc.doUpdateSet({ value: workspaceName.trim() }))
        .execute()

      await saveLixToOpfs({ lix })
      setPolling(Date.now())
      setIsRenamingWorkspace(false)
    } catch (error) {
      console.error("Failed to save workspace name:", error)
      setIsRenamingWorkspace(false)
    }
  }, [lix, workspaceName, setPolling])

  const switchToWorkspace = React.useCallback((workspaceId: string) => {
    navigate(`?l=${workspaceId}`)
  }, [navigate])

  const deleteFile = React.useCallback(async (fileId: string) => {
    if (!lix || !fileId) return

    try {
      const isActiveFile = activeFile?.id === fileId

      // Delete the file
      await lix.db
        .deleteFrom("file")
        .where("id", "=", fileId)
        .execute()

      await saveLixToOpfs({ lix })

      // If we deleted the active file, switch to another file
      if (isActiveFile) {
        const remainingFiles = files.filter((f) => f.id !== fileId)
        if (remainingFiles.length > 0) {
          await switchToFile(remainingFiles[0].id)
        } else {
          // No files left, create a new one
          await createNewFile()
        }
      }

      setPolling(Date.now())
    } catch (error) {
      console.error("Failed to delete file:", error)
    }
  }, [lix, files, activeFile, setPolling, createNewFile])

  const handleCreateNewWorkspace = React.useCallback(async () => {
    try {
      // Create a new lix file
      const { id } = await createNewLixFileInOpfs()

      // Navigate to the new workspace
      navigate(`?l=${id}`)

      // Set polling to refresh the UI
      setPolling(Date.now())
    } catch (error) {
      console.error("Failed to create new workspace:", error)
    }
  }, [navigate])

  const handleImportFile = React.useCallback(async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".md"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (file && lix) {
        try {
          const fileContent = await file.text()
          const fileName = file.name.replace(/\.md$/, '') || generateHumanId()

          const importedFile = await lix.db
            .insertInto("file")
            .values({
              path: `/${fileName}.md`,
              data: new TextEncoder().encode(fileContent),
            })
            .returning("id")
            .executeTakeFirstOrThrow()

          posthog.capture("File Imported", {
            fileName: file.name,
          })

          await saveLixToOpfs({ lix })
          updateUrlParams({ f: importedFile.id })
          setPolling(Date.now())
        } catch (error) {
          console.error("Failed to import file:", error)
        }
      }
    }
    input.click()
  }, [lix, setPolling])

  const handleOpenLixFile = React.useCallback(async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".lix"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (file) {
        try {
          const fileContent = await file.arrayBuffer()
          const opfsRoot = await navigator.storage.getDirectory()
          const lix = await openLixInMemory({
            blob: new Blob([fileContent]),
          })
          const lixId = await lix.db
            .selectFrom("key_value")
            .where("key", "=", "lix_id")
            .select("value")
            .executeTakeFirstOrThrow()

          const opfsFile = await opfsRoot.getFileHandle(`${lixId.value}.lix`, {
            create: true,
          })
          const writable = await opfsFile.createWritable()
          await writable.write(fileContent)
          await writable.close()
          navigate("?l=" + lixId.value)
        } catch (error) {
          console.error("Failed to open Lix file:", error)
        }
      }
    }
    input.click()
  }, [navigate])

  const handleExportLixFile = React.useCallback(async () => {
    if (!lix) return

    try {
      const lixId = await lix.db
        .selectFrom("key_value")
        .where("key", "=", "lix_id")
        .select("value")
        .executeTakeFirstOrThrow()

      const blob = await toBlob({ lix })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `${lixId.value}.lix`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to export Lix file:", error)
    }
  }, [lix])

  const handleExportFile = React.useCallback(async (fileId: string) => {
    if (!lix) return

    try {
      const file = await lix.db
        .selectFrom("file")
        .where("id", "=", fileId)
        .selectAll()
        .executeTakeFirstOrThrow()

      const fileName = file.path.split('/').pop() || 'document.md'
      const fileContent = new TextDecoder().decode(file.data)

      const blob = new Blob([fileContent], { type: 'text/markdown' })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to export file:", error)
    }
  }, [lix])

  const handleDeleteCurrentWorkspace = React.useCallback(async () => {
    if (!lix) return;
    
    try {
      // Get the current project ID
      const lixId = await lix.db
        .selectFrom("key_value")
        .where("key", "=", "lix_id")
        .select("value")
        .executeTakeFirstOrThrow();
      
      // Delete just this project file from OPFS
      const root = await navigator.storage.getDirectory();
      await root.removeEntry(`${lixId.value}.lix`);
      
      // Find another project to navigate to
      const availableLixFiles = [];
      // @ts-expect-error - TS doesn't know about values() yet
      for await (const entry of root.values()) {
        if (entry.kind === "file" && entry.name.endsWith(".lix") && entry.name !== `${lixId.value}.lix`) {
          availableLixFiles.push(entry.name);
        }
      }
      
      if (availableLixFiles.length > 0) {
        // Navigate to another project
        const nextProjectId = availableLixFiles[0].replace(/\.lix$/, '');
        navigate(`?l=${nextProjectId}`);
      } else {
        // No projects left, create a new one by navigating to root
        navigate("/");
      }

      // Trigger polling to refresh the UI
      setPolling(Date.now());
      setShowDeleteProjectsDialog(false);
    } catch (error) {
      console.error("Error deleting current project:", error);
    }
  }, [lix, navigate, setPolling])
  
  const handleResetAllOpfs = React.useCallback(async () => {
    try {
      const root = await navigator.storage.getDirectory();
      // @ts-expect-error - TS doesn't know about values() yet
      for await (const entry of root.values()) {
        if (entry.kind === "file") {
          await root.removeEntry(entry.name);
        }
      }
      navigate("/");
      // trigger "polling" reset all atoms
      setPolling(Date.now());
    } catch (error) {
      console.error("Error resetting OPFS:", error);
    }
  }, [navigate, setPolling])

  // Filter only markdown files (assuming they end with .md)
  // Load workspace name and available workspaces
  // Track current workspace ID
  const [currentWorkspaceId, setCurrentWorkspaceId] = React.useState<string>('')

  const startRenamingWorkspace = React.useCallback(() => {
    setPreviousWorkspaceName(workspaceName)
    setIsRenamingWorkspace(true)
    // Focus on the input field with a slight delay to ensure the DOM has updated
    setTimeout(() => {
      if (workspaceInputRef.current) {
        workspaceInputRef.current.focus()
        workspaceInputRef.current.select() // Select all text for easy replacement
      }
    }, 50)
  }, [workspaceName])

  const cancelRenameWorkspace = React.useCallback(() => {
    setWorkspaceName(previousWorkspaceName)
    setIsRenamingWorkspace(false)
  }, [previousWorkspaceName])

  React.useEffect(() => {
    if (lix) {
      const loadWorkspaceData = async () => {
        try {
          const lixId = await lix.db
            .selectFrom("key_value")
            .where("key", "=", "lix_id")
            .select("value")
            .executeTakeFirstOrThrow();

          // Store current workspace ID for the select component
          setCurrentWorkspaceId(lixId.value);

          // Check if there's a workspace name stored
          const nameRecord = await lix.db
            .selectFrom("key_value")
            .where("key", "=", "workspace_name")
            .select("value")
            .executeTakeFirst();

          if (nameRecord) {
            setWorkspaceName(nameRecord.value);
          } else {
            // Use a human-readable ID as fallback name
            setWorkspaceName(generateHumanId());
          }

          // Load available workspaces
          const root = await navigator.storage.getDirectory();
          const workspaces = [];

          // @ts-expect-error - TS doesn't know about values() yet
          for await (const entry of root.values()) {
            if (entry.kind === "file" && entry.name.endsWith(".lix")) {
              const wsId = entry.name.replace(/\.lix$/, '');
              workspaces.push({
                id: wsId,
                name: wsId === lixId.value ?
                  nameRecord?.value || generateHumanId() :
                  generateHumanId()
              });
            }
          }

          // setAvailableWorkspaces(workspaces);
        } catch (error) {
          console.error("Failed to load workspace data:", error);
        }
      };

      loadWorkspaceData();
    }
  }, [lix]);

  const mdFiles = files.filter(file => file.path.endsWith('.md'))

  return (
    <>
      <SidebarHeader className="flex flex-row justify-between items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 mr-1"
          title="To lix file manager"
          onClick={() => window.location.href = 'https://lix.host/app/fm'}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {isRenamingWorkspace ? (
          <div className="h-7 flex-1 flex items-center border-b border-input max-w-[calc(100%-4rem)]">
            <input
              ref={workspaceInputRef}
              type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onFocus={(e) => e.target.select()}
                onBlur={saveWorkspaceName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveWorkspaceName();
                  } else if (e.key === 'Escape') {
                    cancelRenameWorkspace();
                  }
                }}
              className="bg-transparent outline-none h-7 pl-2 pr-0 text-sm font-semibold w-full mt-[1px]"
              />
            </div>
          ) : (
            <div className="flex-1 min-w-0 mx-1 -my-0.5 max-w-[calc(100%-4rem)]">
              {/* Workspace selector using Select component */}
              <Select
                onValueChange={(value) => {
                  if (value === "new") {
                    handleCreateNewWorkspace();
                  } else {
                    switchToWorkspace(value);
                  }
                }}
                value={currentWorkspaceId}
              >
                <SelectTrigger
                  size="sm"
                className="max-w-full border-0 shadow-none bg-transparent font-semibold text-sm px-1 hover:bg-muted rounded justify-between"
              >
                <SelectValue placeholder="Select Workspace">
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate mr-1">{workspaceName}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="center" className="w-60 -ml-0.5">
                <SelectGroup>
                  <SelectLabel className="font-medium">Workspaces</SelectLabel>
                  {availableWorkspaces.map((workspace: { id: string, name: string }) => (
                    <SelectItem
                      key={workspace.id}
                      value={workspace.id}
                    >
                      <div className="flex items-center w-full">
                        <Folder className="h-4 w-4 mr-2 shrink-0" />
                        <span className="truncate flex-1">{workspace.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value="new">
                    <div className="flex items-center w-full">
                      <Plus className="h-4 w-4 mr-2 shrink-0" />
                      <span>New Workspace</span>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Workspace Options">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 py-1">
            <DropdownMenuItem onClick={handleCreateNewWorkspace}>
              <Plus className="h-4 w-4 mr-2" />
              <span>New Workspace</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenLixFile}>
              <FolderOpen className="h-4 w-4 mr-2" />
              <span>Open Workspace</span>
            </DropdownMenuItem>
            <Separator className="my-1" />
            <DropdownMenuItem onClick={handleExportLixFile}>
              <Download className="h-4 w-4 mr-2" />
              <span>Download Workspace</span>
            </DropdownMenuItem>
            <Separator className="my-1" />
            <DropdownMenuItem onClick={startRenamingWorkspace}>
              <PenSquare className="h-4 w-4 mr-2" />
              <span>Rename Workspace</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteProjectsDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span>Delete Workspace</span>
            </DropdownMenuItem>
            
            {/* Development-only option */}
            {import.meta.env.DEV && (
              <>
                <Separator className="my-1" />
                <DropdownMenuItem
                  className="text-amber-600 focus:text-amber-600mt-1 pt-1"
                  onClick={handleResetAllOpfs}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Reset OPFS (Dev)</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center">
            Files {mdFiles.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({mdFiles.length})</span>
            )}
            <div className="flex flex-grow" />
            <Button
              variant="ghost"
              size="icon"
              title="Import Markdown Document"
              className="flex justify-between items-center mb-2 mr-1"
              onClick={handleImportFile}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="New File"
              className="flex justify-between items-center mb-2"
              onClick={createNewFile}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </SidebarGroupLabel>

          <SidebarMenu>
            {mdFiles.map((file) => (
              <SidebarMenuItem key={file.id}>
                {inlineEditingFile?.id === file.id ? (
                  // Rename state - match the exact height and padding of the SidebarMenuButton
                  <div className="flex items-center w-full h-8 p-2 rounded-md">
                    <FileText className={`h-4 w-4 mr-2 shrink-0 ${file.id === activeFile?.id ? 'text-primary' : ''}`} />
                    <div className="flex items-center border-b border-input min-w-0">
                      <input
                        autoFocus
                        ref={inlineInputRef}
                        type="text"
                        value={inlineEditingFile.name}
                        data-current-editing-id={inlineEditingFile.id}
                        onChange={(e) => setInlineEditingFile(prev => prev ? { ...prev, name: e.target.value } : null)}
                        onFocus={(e) => e.target.select()}
                        onBlur={saveInlineRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveInlineRename()
                          } else if (e.key === 'Escape') {
                            setInlineEditingFile(null)
                          }
                        }}
                        className="bg-transparent outline-none text-sm min-w-0 mt-[1px]"
                      />
                      <span className="text-muted-foreground text-sm whitespace-nowrap">.md</span>
                    </div>
                  </div>
                ) : (
                    <SidebarMenuButton
                      isActive={file.id === activeFile?.id}
                      onClick={() => switchToFile(file.id)}
                      onDoubleClick={() => {
                        const fileName = file.path.split('/').pop()?.replace(/\.md$/, '') || ''
                        setInlineEditingFile({ id: file.id, name: fileName })
                        // Focus and select the input text
                        setTimeout(() => {
                          if (inlineInputRef.current) {
                            inlineInputRef.current.focus()
                            inlineInputRef.current.select()
                          }
                        }, 50)
                      }}
                      className={`w-full justify-start ${file.id === activeFile?.id ? 'font-medium' : ''}`}
                    >
                      <FileText className={`h-4 w-4 ${file.id === activeFile?.id ? 'text-primary' : ''}`} />
                      <span>{file.path.split('/').pop()}</span>
                    </SidebarMenuButton>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreVertical className="h-4 w-4" />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 py-1">
                    <DropdownMenuItem onClick={() => {
                      const fileName = file.path.split('/').pop()?.replace(/\.md$/, '') || ''
                      setInlineEditingFile({ id: file.id, name: fileName })
                      // Focus on the input field with a slight delay to ensure the DOM has updated
                      setTimeout(() => {
                        if (inlineInputRef.current) {
                          inlineInputRef.current.focus()
                          inlineInputRef.current.select() // Select all text for easy replacement
                        }
                      }, 50)
                    }}>
                      <PenSquare className="h-4 w-4 mr-2" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportFile(file.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      <span>Export as Markdown</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setFileToDelete(file.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}

            {mdFiles.length === 0 && (
              <div className="px-2 py-4 text-center">
                <div className="text-sm text-muted-foreground mb-2">
                  No documents found.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={createNewFile}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create New Document
                </Button>
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <InfoCard />
      </SidebarFooter>



      {/* Delete File Confirmation Dialog */}
      <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (fileToDelete) {
                  deleteFile(fileToDelete)
                  setFileToDelete(null)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Current Workspace Confirmation Dialog */}
      <Dialog open={showDeleteProjectsDialog} onOpenChange={setShowDeleteProjectsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Current Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the current workspace? This will remove all files in this workspace and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteCurrentWorkspace}
            >
              Delete Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}