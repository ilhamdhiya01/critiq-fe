import { describe, expect, it } from "vitest";

import { parseUnifiedPatch } from "../diff.helper";

describe("parseUnifiedPatch", () => {
  it("numbers context, removed and added lines from the hunk header", () => {
    const patch = [
      "@@ -10,3 +20,3 @@ function foo() {",
      " const a = 1;",
      "-const b = 2;",
      "+const b = 3;",
      " return a + b;",
    ].join("\n");

    expect(parseUnifiedPatch(patch)).toEqual([
      {
        type: "hunk",
        oldLineNumber: null,
        newLineNumber: null,
        content: "@@ -10,3 +20,3 @@ function foo() {",
      },
      {
        type: "context",
        oldLineNumber: 10,
        newLineNumber: 20,
        content: "const a = 1;",
      },
      {
        type: "removed",
        oldLineNumber: 11,
        newLineNumber: null,
        content: "const b = 2;",
      },
      {
        type: "added",
        oldLineNumber: null,
        newLineNumber: 21,
        content: "const b = 3;",
      },
      {
        type: "context",
        oldLineNumber: 12,
        newLineNumber: 22,
        content: "return a + b;",
      },
    ]);
  });

  it("restarts numbering at every hunk", () => {
    const patch = ["@@ -1 +1 @@", "-a", "+b", "@@ -50,2 +60,2 @@", " c"].join(
      "\n",
    );

    const lines = parseUnifiedPatch(patch);

    expect(lines.filter((line) => line.type === "hunk")).toHaveLength(2);
    expect(lines.at(-1)).toEqual({
      type: "context",
      oldLineNumber: 50,
      newLineNumber: 60,
      content: "c",
    });
  });

  it("parses hunk headers without line counts", () => {
    expect(parseUnifiedPatch("@@ -7 +9 @@\n+x")[1]).toEqual({
      type: "added",
      oldLineNumber: null,
      newLineNumber: 9,
      content: "x",
    });
  });

  it("skips the trailing newline and 'No newline at end of file' markers", () => {
    const patch = "@@ -1 +1 @@\n-a\n\\ No newline at end of file\n+b\n";

    expect(parseUnifiedPatch(patch).map((line) => line.type)).toEqual([
      "hunk",
      "removed",
      "added",
    ]);
  });

  it("keeps the content after the marker untouched", () => {
    const [, line] = parseUnifiedPatch("@@ -1 +1 @@\n+  indented + plus");

    expect(line.content).toBe("  indented + plus");
  });

  it("returns no lines for an empty patch", () => {
    expect(parseUnifiedPatch("")).toEqual([]);
  });
});
