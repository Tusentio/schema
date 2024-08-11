import prettier from "eslint-config-prettier";
import ts from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
export default [
    ...ts.configs.recommendedTypeChecked,
    ...ts.configs.stylisticTypeChecked,
    prettier,
    {
        rules: {
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/strict-boolean-expressions": "error",
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },
    {
        ignores: ["dist/", "**/*.js"],
    },
];
