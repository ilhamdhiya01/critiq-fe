import type { DiffLine } from "@/lib/types/pull-request.types";

const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

// DOM id shared by the diff row and anything linking to it (the Flagged
// Issues card). File paths contain slashes and dots, which are legal in an
// id but awkward in a CSS selector — this is only ever looked up with
// getElementById, so no escaping is needed.
export const getDiffLineElementId = (filePath: string, line: number) =>
  `diff-line:${filePath}:${line}`;

export const parseUnifiedPatch = (patch: string): DiffLine[] => {
  const lines: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const raw of patch.split("\n")) {
    const match = HUNK_HEADER.exec(raw);
    if (match) {
      oldLine = Number(match[1]);
      newLine = Number(match[2]);
      lines.push({
        type: "hunk",
        oldLineNumber: null,
        newLineNumber: null,
        content: raw,
      });
      continue;
    }

    // Trailing split artifact, or "\ No newline at end of file"
    if (raw === "" || raw.startsWith("\\")) continue;

    const marker = raw[0];
    const content = raw.slice(1);

    if (marker === "+") {
      lines.push({
        type: "added",
        oldLineNumber: null,
        newLineNumber: newLine++,
        content,
      });
    } else if (marker === "-") {
      lines.push({
        type: "removed",
        oldLineNumber: oldLine++,
        newLineNumber: null,
        content,
      });
    } else {
      lines.push({
        type: "context",
        oldLineNumber: oldLine++,
        newLineNumber: newLine++,
        content,
      });
    }
  }

  return lines;
};
