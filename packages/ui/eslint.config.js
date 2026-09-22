import { config } from "@vidcastx/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  // Vendored shadcn components and hooks — upstream code, not edited in this repo per .claude/rules/shadcn.md
  {
    files: ["src/components/**/*.{ts,tsx}", "src/hooks/use-mobile.ts"],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "react-hooks/set-state-in-effect": "off",
      eqeqeq: "off",
      // Accessibility is owned by shadcn upstream — consumers own per-usage a11y.
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/anchor-has-content": "off",
      // Shadcn's sidebar uses document.cookie by design.
      "unicorn/no-document-cookie": "off",
    },
  },
];
