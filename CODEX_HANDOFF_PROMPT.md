# Codex Business Handoff Prompt

Use this prompt after merging this Personal workspace into ChatGPT Business:

```text
You are working on the Kho Phong Realtime / Phong Moi Gioi source code.

Before making any code changes, read the project context in this order:

1. Read PROJECT_CONTEXT.md if it exists.
2. Read PRD_MVP_V1.md if it exists.
3. Read CURRENT_PROJECT_STATUS.md.
4. Read README.md if it exists.
5. Read package.json.
6. Read AGENTS.md and skill.md if they exist.
7. Read the relevant ai_context/*.md files.
8. Read supabase/migrations if present, and also read supabase/*.sql plus module_02_supabase_schema.sql if present.

Important constraints:

- Do not rewrite the whole app.
- Do not refactor unrelated code.
- Do not break the existing auth architecture.
- Do not weaken RLS or database ownership checks.
- Do not change or drop database schema casually.
- Do not run migrations against a real database unless I explicitly ask.
- Do not expose service-role keys or commit .env files.
- User-facing UI text should remain Vietnamese.
- Keep Next.js App Router, Supabase, TypeScript, and Tailwind patterns already used in the codebase.

After reading, report your understanding of:

- Product goal.
- Current module state.
- Main routes.
- Auth/role rules.
- Database and migration risks.
- Important files.
- Known issues.

Only start modifying code after I give you a specific task.
```
