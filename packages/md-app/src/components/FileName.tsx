import { useAtom } from "jotai";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { activeFileAtom } from "@/state-active-file";
import { lixAtom, withPollingAtom } from "@/state";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs";
import { PencilIcon } from "lucide-react";

export default function FileName() {
  const [activeFile] = useAtom(activeFileAtom);
  const [lix] = useAtom(lixAtom);
  const [, setPolling] = useAtom(withPollingAtom);
  const [isEditing, setIsEditing] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenSpanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (activeFile) {
      // Extract just the filename without path and extension
      const fullName = activeFile.path.split('/').pop() || "";
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

    await saveLixToOpfs({ lix });
    setPolling(Date.now()); // Refresh state
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
    <div className="flex items-center gap-1 cursor-pointer group">
      {/* Hidden span to measure text width */}
      <span 
        ref={hiddenSpanRef} 
        className="absolute -left-[9999px] font-medium text-slate-700 whitespace-nowrap"
        aria-hidden="true"
      >
        {fileName || 'Filename'}
      </span>

      {isEditing ? (
        <div className="flex items-center border-b border-slate-300 focus-within:border-slate-500">
          <input
            ref={inputRef}
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="bg-transparent outline-none pt-0.5 px-1 font-medium text-slate-700 min-w-[80px] text-right transition-all"
            placeholder="Filename"
          />
          <span className="font-medium text-slate-500 mr-1">.md</span>
        </div>
      ) : (
        <div
          className="flex items-center gap-1 hover:bg-slate-100 py-0.5 px-1.5 rounded transition-colors"
          onClick={() => setIsEditing(true)}
        >
          <h1 className="font-medium text-slate-700">
            {fileName}<span className="text-slate-500">.md</span>
          </h1>
          <PencilIcon className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
}