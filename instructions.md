Run an ESLint-based static analysis and refactor the codebase to ensure strict compliance with standard TypeScript and React best practices.

Enforce the following ESLint rules across all modified files:
1. `no-unused-vars` / `@typescript-eslint/no-unused-vars`: Remove all unused imports, variables, and arguments.
2. `@typescript-eslint/no-explicit-any`: Replace any fallback types with strict, explicit TypeScript interfaces or union types.
3. `react-hooks/rules-of-hooks` & `react-hooks/exhaustive-deps`: Ensure hook dependency arrays are complete, stable, and avoid memory leaks.
4. `no-console`: Remove debugging logs or replace them with formal error boundaries/handlers.
5. Code structure: Ensure early returns, consistent file exports, and proper null/undefined safety checks.

Output format:
- List each ESLint issue identified along with its target file and line/scope.
- Provide the corrected, production-ready code file by file with clear file path headings.
- Do not use placeholders or omit existing application logic.
