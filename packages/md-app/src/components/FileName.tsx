import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useQuery } from "@/hooks/useQuery";
import { selectActiveFile, selectLix } from "@/queries";

export default function FileName() {
  const [activeFile] = useQuery(selectActiveFile);
  const [lix, , , refetch] = useQuery(selectLix);
  const [isEditing, setIsEditing] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenSpanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (activeFile) {
      // Extract just the filename without path and extension
      const fullName = activeFile?.path?.split('/').pop() || "";
      const name = fullName.replace(/\.md$/, "");
      setFileName(name);
    }
  }, [activeFile]);

  // Adjust input width based on content
  useEffect(() => {
    if (isEditing && inputRef.current && hiddenSpanRef.current) {
      // Update the hidden span's content
      hiddenSpanRef.current.textContent = fileName || 'Filename';
      
      // Get the width and set it on the input
      const width = hiddenSpanRef.current.offsetWidth;
      inputRef.current.style.width = `${width + 10}px`; // Add some padding
    }
  }, [fileName, isEditing]);

  const handleSave = async () => {
    if (!activeFile || !lix) return;

    // Don't save if filename is empty
    if (!fileName.trim()) {
      // Reset to original name
      const fullName = activeFile.path.split('/').pop() || "";
      const name = fullName.replace(/\.md$/, "");
      setFileName(name);
      setIsEditing(false);
      return;
    }

    // Get directory path
    const dirPath = activeFile.path.includes('/')
      ? activeFile.path.substring(0, activeFile.path.lastIndexOf('/') + 1)
      : '/';

    // Create new path with updated filename
    const newPath = `${dirPath}${fileName}.md`;

    // Update file path in database
    await lix.db
      .updateTable("file")
      .set({ path: newPath })
      .where("id", "=", activeFile.id)
      .execute();

    // OpfsStorage now handles persistence automatically through the onStateCommit hook
    refetch(); // Refresh state
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      // Reset to original name
      if (activeFile) {
        const fullName = activeFile.path.split('/').pop() || "";
        const name = fullName.replace(/\.md$/, "");
        setFileName(name);
      }
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!activeFile) return null;

  return (
    <div className="flex items-center cursor-pointer">
      {/* Hidden span to measure text width */}
      <span 
        ref={hiddenSpanRef} 
        className="absolute -left-[9999px] font-medium text-slate-700 whitespace-nowrap"
        aria-hidden="true"
      >
        {fileName || 'Filename'}
      </span>

      {isEditing ? (
        <div className="flex items-center h-8 px-1.5 border-b border-slate-300 focus-within:border-slate-500 -my-0.5">
          <input
            ref={inputRef}
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="bg-transparent outline-none font-medium text-slate-700 min-w-[80px] transition-all h-full"
            placeholder="Filename"
          />
        </div>
      ) : (
        <div
            className="flex items-center h-8 px-1.5 hover:bg-slate-100 rounded transition-colors cursor-pointer -my-0.5"
          onClick={() => setIsEditing(true)}
        >
            <span className="font-medium text-slate-700">{fileName}</span>
        </div>
      )}
    </div>
  );
}