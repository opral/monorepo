import { useEffect } from "react";
import { useLix } from "@/hooks/use-lix.ts";
import { openLixInMemory, toBlob } from "@lix-js/sdk";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { DownloadIcon, FileIcon } from "lucide-react";
import { useContext } from "react";
import { Context } from "../context";

export default function Layout() {
  const lix = useLix();
  const { setLix, rootContainer } = useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();

  // Update body padding when the inspector height changes
  useEffect(() => {
    if (!rootContainer) return;

    const updateBodyPadding = () => {
      const height = `${rootContainer.offsetHeight}px`;
      const styleEl = document.getElementById(
        "lix-inspector-style"
      ) as HTMLStyleElement;
      if (styleEl) {
        styleEl.textContent = `body { padding-top: ${height}; }`;
      }
    };

    // Initial update
    updateBodyPadding();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateBodyPadding);
    resizeObserver.observe(rootContainer);

    return () => {
      resizeObserver.disconnect();
    };
  }, [rootContainer]);

  // Export Lix as blob
  const exportLixAsBlob = async () => {
    try {
      const blob = await toBlob({ lix });

      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lix-export-${new Date().toISOString().slice(0, 10)}.lix`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const openLixBlob = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".lix";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const buffer = await file.arrayBuffer();
      const newLix = await openLixInMemory({ blob: new Blob([buffer]) });
      setLix(newLix);
    };

    input.click();
  };

  // Navigation items
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/data-explorer", label: "Data Explorer" },
    { path: "/graph", label: "Graph" },
  ];

  return (
    <div className="flex flex-col w-full" data-theme="light">
      <header className="bg-background">
        <div className="container mx-auto py-2 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-medium">Lix Inspector</span>
          </div>

          <nav className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-md ${
                  location.pathname === item.path
                    ? "bg-gray-200 font-medium"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn m-1">
              Actions
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
            >
              <li>
                <a onClick={openLixBlob}>
                  <FileIcon className="mr-2 h-4 w-4" />
                  Open lix
                </a>
              </li>
              <li>
                <a onClick={exportLixAsBlob}>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export lix
                </a>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
