import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client, if the output is ever moved into the repo.
    "src/generated/**",
  ]),

  {
    /**
     * shadcn/ui primitives are vendored source: they are copied in from
     * upstream and re-copied on update, so local edits are lost. Holding them to
     * the React Compiler rules would mean either patching every update or
     * leaving the lint permanently red. Application code in src/modules and
     * src/app is NOT exempt.
     */
    files: ["src/components/ui/**"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
