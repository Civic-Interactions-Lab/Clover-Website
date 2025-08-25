import React from "react";
import { Plus, Minus } from "lucide-react";

interface DiffPart {
  type: "added" | "removed" | "equal" | "empty";
  text: string;
}

interface CharDiffResult {
  old: DiffPart[];
  new: DiffPart[];
}

interface DiffLine {
  type: "equal" | "modified" | "removed" | "added";
  oldLine: string | DiffPart[];
  newLine: string | DiffPart[];
  lineNumber: number;
  hasChanges?: boolean;
}

interface CodeDiffViewerProps {
  oldCode: string;
  newCode: string;
  oldTitle?: string;
  newTitle?: string;
  language?: string;
}

interface DiffLineProps {
  parts: DiffPart[] | string;
  type: "old" | "new";
}

// Simple diff algorithm to find character-level differences
const computeDiff = (oldStr: string, newStr: string): DiffLine[] => {
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");

  const maxLines = Math.max(oldLines.length, newLines.length);
  const diffResult: DiffLine[] = [];

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || "";
    const newLine = newLines[i] || "";

    if (oldLine === newLine) {
      diffResult.push({
        type: "equal",
        oldLine,
        newLine,
        lineNumber: i + 1,
      });
    } else if (oldLine && newLine) {
      // Modified line - compute character diff
      const charDiff = computeCharDiff(oldLine, newLine);
      diffResult.push({
        type: "modified",
        oldLine: charDiff.old,
        newLine: charDiff.new,
        lineNumber: i + 1,
        hasChanges: true,
      });
    } else if (oldLine && !newLine) {
      diffResult.push({
        type: "removed",
        oldLine,
        newLine: "",
        lineNumber: i + 1,
      });
    } else if (!oldLine && newLine) {
      diffResult.push({
        type: "added",
        oldLine: "",
        newLine,
        lineNumber: i + 1,
      });
    }
  }

  return diffResult;
};

// Simple character-level diff for highlighting changes within lines
const computeCharDiff = (oldStr: string, newStr: string): CharDiffResult => {
  // Simple word-based diff for better readability
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);

  const result: CharDiffResult = {
    old: [],
    new: [],
  };

  let i = 0,
    j = 0;

  while (i < oldWords.length || j < newWords.length) {
    if (i >= oldWords.length) {
      // Remaining new words are additions
      result.new.push({ type: "added", text: newWords[j] });
      result.old.push({ type: "empty", text: "" });
      j++;
    } else if (j >= newWords.length) {
      // Remaining old words are removals
      result.old.push({ type: "removed", text: oldWords[i] });
      result.new.push({ type: "empty", text: "" });
      i++;
    } else if (oldWords[i] === newWords[j]) {
      // Words match
      result.old.push({ type: "equal", text: oldWords[i] });
      result.new.push({ type: "equal", text: newWords[j] });
      i++;
      j++;
    } else {
      // Words don't match - mark as changed
      result.old.push({ type: "removed", text: oldWords[i] });
      result.new.push({ type: "added", text: newWords[j] });
      i++;
      j++;
    }
  }

  return result;
};

const DiffLine: React.FC<DiffLineProps> = ({ parts, type }) => {
  if (!parts || (Array.isArray(parts) && parts.length === 0)) {
    return <span className="opacity-50">—</span>;
  }

  // Handle string input - preserve whitespace
  if (typeof parts === "string") {
    return (
      <span className="text-gray-800 dark:text-gray-200 whitespace-pre">
        {parts}
      </span>
    );
  }

  return (
    <span className="whitespace-pre">
      {parts.map((part: DiffPart, index: number) => (
        <span
          key={index}
          className={
            part.type === "added"
              ? "bg-green-300 dark:bg-green-600 text-green-900 dark:text-green-100 px-1 rounded"
              : part.type === "removed"
                ? "bg-red-300 dark:bg-red-600 text-red-900 dark:text-red-100 px-1 rounded"
                : part.type === "empty"
                  ? "opacity-0"
                  : ""
          }
        >
          {part.text}
        </span>
      ))}
    </span>
  );
};

const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  oldCode,
  newCode,
  oldTitle = "Original",
  newTitle = "Modified",
}) => {
  const diffLines = computeDiff(oldCode || "", newCode || "");

  return (
    <div className="space-y-4">
      {/* Headers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <Minus className="w-4 h-4" />
          <h3 className="text-lg font-semibold">{oldTitle}</h3>
        </div>
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Plus className="w-4 h-4" />
          <h3 className="text-lg font-semibold">{newTitle}</h3>
        </div>
      </div>

      {/* Diff Content */}
      <div className="grid grid-cols-2 gap-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Old Code Column */}
        <div className="border-r border-gray-200 dark:border-gray-700">
          <div className="overflow-auto">
            {diffLines.map((line: DiffLine, index: number) => (
              <div
                key={index}
                className={`flex text-xs font-mono ${
                  line.type === "removed"
                    ? "bg-red-200 dark:bg-red-700 border-l-4 border-red-500 dark:border-red-400"
                    : line.type === "modified"
                      ? "bg-red-100 dark:bg-red-800 border-l-4 border-red-400 dark:border-red-300"
                      : line.type === "added"
                        ? "bg-gray-100 dark:bg-gray-700 opacity-60"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                }`}
              >
                <div
                  className={`w-12 flex-shrink-0 px-2 py-2 text-right text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600 ${
                    line.type === "removed"
                      ? "bg-red-150 dark:bg-red-800/80"
                      : line.type === "modified"
                        ? "bg-red-75 dark:bg-red-900/60"
                        : line.type === "added"
                          ? "bg-gray-150 dark:bg-gray-800/80"
                          : "bg-gray-50 dark:bg-gray-800/40"
                  }`}
                >
                  {line.type !== "added" ? line.lineNumber : ""}
                </div>
                <div className="flex-1 px-4 py-2">
                  {line.type === "modified" ? (
                    <DiffLine parts={line.oldLine} type="old" />
                  ) : line.type !== "added" ? (
                    <DiffLine parts={line.oldLine} type="old" />
                  ) : (
                    <span className="opacity-50">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Code Column */}
        <div>
          <div className="overflow-auto">
            {diffLines.map((line: DiffLine, index: number) => (
              <div
                key={index}
                className={`flex text-xs font-mono ${
                  line.type === "added"
                    ? "bg-green-200 dark:bg-green-700 border-l-4 border-green-500 dark:border-green-400"
                    : line.type === "modified"
                      ? "bg-green-100 dark:bg-green-800 border-l-4 border-green-400 dark:border-green-300"
                      : line.type === "removed"
                        ? "bg-gray-100 dark:bg-gray-700 opacity-60"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                }`}
              >
                <div
                  className={`w-12 flex-shrink-0 px-2 py-2 text-right text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600 ${
                    line.type === "added"
                      ? "bg-green-150 dark:bg-green-800/80"
                      : line.type === "modified"
                        ? "bg-green-75 dark:bg-green-900/60"
                        : line.type === "removed"
                          ? "bg-gray-150 dark:bg-gray-800/80"
                          : "bg-gray-50 dark:bg-gray-800/40"
                  }`}
                >
                  {line.type !== "removed" ? line.lineNumber : ""}
                </div>
                <div className="flex-1 px-4 py-2">
                  {line.type === "modified" ? (
                    <DiffLine parts={line.newLine} type="new" />
                  ) : line.type !== "removed" ? (
                    <DiffLine parts={line.newLine} type="new" />
                  ) : (
                    <span className="opacity-50">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeDiffViewer;
