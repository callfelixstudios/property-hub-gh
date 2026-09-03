# CRITICAL RULES - MUST FOLLOW



## RESPONSE

- Keep response concise and to the point - unless the user asks otherwise.


## PLANNING MODE

- Always ask clarifying questions.
- Never assume design, tech stack or features.
- Use deep-dive sub-agents to assist with research.
- Use deep-dive sub-agents to review the different aspects of your plan before presenting it to the user.





## CHANGE / EDIT MODE

- Never implement features yourself. When possible, use sub-agents!

- Identify changes from the plan that can be implemented in parallel, and use sub-agents to implement the features efficiently.

- When using sub-agents tot implement features, act as a coordinator only.

- Use the best model for the best task - premium models for complex tasks (like coding) and mid-tier models for simpler tasks, like documentation.

- After completing features (large or small), always sun commands like lint, type check and next build to check code quality.



## DATABASE SCHEMA CHANGES

- Whenever you make changes to the database schema, ALWAYS run the drizzle generate and migrate commands.
- NEVER run drizzle push



## TESTING

- Use any testing tools, libraries available to the project for testing your change.
- NEVER assume your changes simply work, always test !
- If the project does not have any testing tools, scripts, MCP tools, skills etc. available for testing, ask the user whether testing should be skipped.



## UI DESIGN

- Always follow the UI design system when creating or reviewing components or pages.

- Design system: @DESIGN.md


## 🧠 Project Memory & Documentation State (Obsidian)

- **Trigger:** Immediately following any successful `git push` to the remote repository.
- **Action:** A sub-agent must automatically compile a technical update summary markdown file.
- **Storage Target Vault Location:** `C:\Users\CallFELIX\Documents\PROJECT\property-hub-gh\obsidian-vault`
- **Dynamic File Naming Hook:** Sub-agent must generate the filename dynamically using the runtime system date plus a short hyphenated milestone descriptor: `YYYY-MM-DD-HHmm-<milestone-descriptor>.md` (e.g., `2026-08-12-1410-seo-skill-install-push.md`).
- **Required Report Structure:**
  1. **Execution Timestamp:** `Executed on: YYYY-MM-DD at HH:mm:ss GMT` (Generated dynamically via local system clock).
  2. **Milestone Summary:** High-level summary of the pushed changes.
  3. **Files Modified:** Bulleted list of altered file paths.
  4. **Data/UI Architecture State:** Explicitly document current active object states.
  5. **Next Immediate Steps:** Remaining goals for the active feature branch.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
