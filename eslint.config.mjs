import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    name: "critiq/style",
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "func-style": [
        "error",
        "expression",
        {
          allowArrowFunctions: true,
          overrides: { namedExports: "expression" },
        },
      ],
      "prefer-arrow-callback": [
        "error",
        { allowNamedFunctions: false, allowUnboundThis: true },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration > FunctionDeclaration",
          message:
            "Gunakan `const Nama = () => {}` lalu `export default Nama`. Dilarang `export default function`.",
        },
        {
          selector: "VariableDeclarator > FunctionExpression[generator=false]",
          message: "Semua fungsi harus arrow function.",
        },
      ],
    },
  },

  {
    name: "critiq/config-files",
    files: ["*.config.{js,mjs,cjs,ts,mts}", "commitlint.config.js"],
    rules: {
      "func-style": "off",
      "no-restricted-syntax": "off",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project additions:
    "coverage/**",
    "public/**",
    "pnpm-lock.yaml",
  ]),
]);

export default eslintConfig;
