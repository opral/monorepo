import { useState, useMemo } from "react";
import { GitPullRequest, ChevronDown, Check } from "lucide-react";

// LixIcon component with animation
const LixIcon = ({ size = 24, className = "" }) => {
  return (
    <svg
      width={size}
      height={size * 0.7} // Maintain aspect ratio
      viewBox="0 0 26 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M14.7618 5.74842L16.9208 9.85984L22.3675 0.358398H25.7133L19.0723 11.6284L22.5712 17.5085H19.2407L16.9208 13.443L14.6393 17.5085H11.2705L14.7618 11.6284L11.393 5.74842H14.7618Z"
        fill="currentColor"
      />
      <path
        d="M6.16211 17.5081V5.74805H9.42368V17.5081H6.16211Z"
        fill="currentColor"
      />
      <path
        d="M3.52112 0.393555V17.6416H0.287109V0.393555H3.52112Z"
        fill="currentColor"
      />
      <path
        d="M6.21582 0.393555H14.8399V3.08856H6.21582V0.393555Z"
        fill="currentColor"
      />
    </svg>
  );
};

// Flash icon for watermark
const FlashIcon = ({ className = "" }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M13 10H20L11 23V14H4L13 1V10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const ChangeControlFeature = () => {
  const [activeVersion, setActiveVersion] = useState(2);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const versions = [
    {
      id: 1,
      content:
        "The project deadline is on October 15th. We need to complete all tasks by then.",
    },
    {
      id: 2,
      content:
        "The project deadline is on October 21st. We need to complete all critical tasks by then, with remaining items completed by October 28th.",
    },
    {
      id: 3,
      content:
        "The project deadline has been extended to October 21st. We need to complete all critical tasks by then, with remaining items completed by end of month.",
    },
  ];

  const currentVersion =
    versions.find((v) => v.id === activeVersion) || versions[0];
  const previousVersion = versions.find((v) => v.id === activeVersion - 1);

  // Character-based diff function
  const generateCharacterDiff = (oldText: string, newText: string) => {
    let i = 0;
    let j = 0;

    // Find the longest common prefix
    while (
      i < oldText.length &&
      i < newText.length &&
      oldText[i] === newText[i]
    ) {
      i++;
    }

    // Find the longest common suffix
    while (
      j < oldText.length - i &&
      j < newText.length - i &&
      oldText[oldText.length - 1 - j] === newText[newText.length - 1 - j]
    ) {
      j++;
    }

    // Create parts
    const prefix = oldText.substring(0, i);
    const removed = oldText.substring(i, oldText.length - j);
    const added = newText.substring(i, newText.length - j);
    const suffix = oldText.substring(oldText.length - j);

    return { prefix, removed, added, suffix };
  };

  // Compute diff between versions
  const diff = useMemo(() => {
    if (!previousVersion) return null;
    return generateCharacterDiff(
      previousVersion.content,
      currentVersion.content
    );
  }, [previousVersion, currentVersion]);

  // Count word changes
  const addedWords = useMemo(() => {
    if (!diff?.added) return 0;
    return diff.added.split(/\s+/).filter(Boolean).length;
  }, [diff]);

  const removedWords = useMemo(() => {
    if (!diff?.removed) return 0;
    return diff.removed.split(/\s+/).filter(Boolean).length;
  }, [diff]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Select version
  const selectVersion = (id: number) => {
    setActiveVersion(id);
    setDropdownOpen(false);
  };

  return (
    <div className="glassmorphic p-7 h-full hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 bg-gradient-conic from-blue-500/20 via-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-slow-rotate"></div>

      {/* Watermark */}
      <FlashIcon className="absolute bottom-3 right-3 text-yellow-500/10 w-10 h-10" />

      {/* 1. Header Block with Logo + Title */}
      <div className="relative z-10 flex flex-col items-center space-y-4">
        {/* Logo */}
        <div className="transform hover:scale-110 transition-transform duration-300">
          <LixIcon size={36} className="text-[#08B5D6] animate-pulse-slow" />
        </div>

        {/* Title using Hero styling */}
        <div className="inline-flex items-center">
          <span className="relative px-1.5 py-0.5 mr-0.5">
            <span className="relative z-10 font-semibold flex items-center gap-1">
              <span>
                <span className="text-green-400 font-medium">Change</span>
                <span className="text-red-400 line-through opacity-70 mx-1">
                  tracking
                </span>
                <span className="text-green-400 font-medium">Control</span>
              </span>
            </span>
            <span className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-400/5 rounded-md border border-green-400/30 blur-[0.5px]"></span>
          </span>
        </div>
      </div>

      {/* Version Dropdown Selector */}
      <div className="relative z-20 mt-5 mb-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Current Version:</span>
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-black/30 rounded-md border border-white/10 hover:bg-black/40 transition-colors"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              Version {activeVersion}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <>
                {/* Invisible overlay to capture clicks outside */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                  aria-hidden="true"
                ></div>

                {/* Dropdown menu */}
                <div className="absolute right-0 mt-1 w-40 bg-black/90 backdrop-blur-lg rounded-md border border-white/10 shadow-xl z-30 overflow-hidden">
                  {versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => selectVersion(version.id)}
                      className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors ${
                        version.id === activeVersion
                          ? "bg-blue-900/30 text-blue-300"
                          : "hover:bg-white/10"
                      }`}
                    >
                      Version {version.id}
                      {version.id === activeVersion && (
                        <Check size={14} className="text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Compact Diff Viewer */}
      <div className="relative z-10 bg-black/40 backdrop-blur-sm rounded-lg p-3 mt-2 max-h-[180px] overflow-auto">
        {activeVersion > 1 && diff ? (
          <div className="text-xs font-mono p-2">
            {/* Character-based diff */}
            <div className="leading-relaxed">
              <span className="text-white">{diff.prefix}</span>
              <span className="bg-red-500/20 text-red-400 px-0.5 py-0.5 rounded">
                {diff.removed}
              </span>
              <span className="bg-green-500/20 text-green-400 px-0.5 py-0.5 rounded">
                {diff.added}
              </span>
              <span className="text-white">{diff.suffix}</span>
            </div>
          </div>
        ) : (
          <div className="px-2 py-1.5 text-xs font-mono text-white">
            {currentVersion.content}
          </div>
        )}
      </div>

      {/* Details about the changes */}
      <div className="relative z-10 mt-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {addedWords > 0 && (
              <span className="px-1.5 py-0.5 bg-black/30 rounded text-green-400">
                +{addedWords} word{addedWords !== 1 ? "s" : ""}
              </span>
            )}
            {removedWords > 0 && (
              <span className="px-1.5 py-0.5 bg-black/30 rounded text-red-400">
                -{removedWords} word{removedWords !== 1 ? "s" : ""}
              </span>
            )}
            {activeVersion === 1 && (
              <span className="px-1.5 py-0.5 bg-black/30 rounded text-gray-400">
                Original version
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. CTA Section */}
      <div className="relative z-10 mt-4">
        <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-4 flex flex-col space-y-3 group hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-shadow duration-300">
          <h4 className="text-blue-400 font-medium">
            Ready to submit a{" "}
            <span className="font-bold text-white px-1.5 py-0.5 mx-0.5 bg-blue-500/30 border border-blue-400/30 rounded-md shadow-sm shadow-blue-500/20 inline-block">
              change proposal
            </span>
            ?
          </h4>
          <p className="text-sm text-gray-300">
            Submit changes for team review with inline comments and versioned
            history tracking.
          </p>

          <a 
            href="https://github.com/opral/monorepo/tree/main/packages/lix-sdk" 
            target="_blank" 
            rel="noopener noreferrer"
            className="self-start flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-colors duration-200 group/btn"
          >
            <GitPullRequest
              size={16}
              className="text-blue-400 transition-transform duration-300 group-hover/btn:scale-110"
            />
            <span className="text-sm text-blue-300">Propose Change</span>
          </a>
        </div>
      </div>

      {/* Feature list */}
      <div className="relative z-10 mt-4 bg-black/20 rounded-lg p-4 border border-white/5">
        <div className="text-xs text-blue-400 font-medium mb-2 flex items-center">
          <GitPullRequest size={12} className="mr-2" />
          <span>Key change control features:</span>
        </div>
        <ul className="text-xs text-gray-400 space-y-2">
          <li className="flex items-start group/feature hover:bg-black/20 p-1 rounded transition-colors">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="mr-2 mt-0.5 text-blue-400/80 group-hover/feature:text-blue-400 transition-colors"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span className="group-hover/feature:text-white transition-colors">
              Granular character-level diffs for precise change tracking
            </span>
          </li>
          <li className="flex items-start group/feature hover:bg-black/20 p-1 rounded transition-colors">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="mr-2 mt-0.5 text-blue-400/80 group-hover/feature:text-blue-400 transition-colors"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span className="group-hover/feature:text-white transition-colors">
              Versions, comments, and approvals all in one place
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ChangeControlFeature;
