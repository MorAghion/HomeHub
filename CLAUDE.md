
```markdown
# CLAUDE.md — HomeHub Project Context

## Project Overview
HomeHub is a shared household management PWA built with React (Vite) + TypeScript + Tailwind CSS, backed by Supabase (Auth, Postgres, Storage, Edge Functions).

## Architecture
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **State:** Supabase for persistent data, localStorage for offline cache
- **Styling:** Tailwind with custom palette — Primary: #630606 (Burgundy), Background: #F5F2E7 (Cream)

## Hierarchy
- Hub (domain) → Sub-Hub (specific list) → Master List (template) + Active List (session)
- Context engine maps Sub-Hub names to starter packs via keyword matching

## Key Directories
- src/components/ — Reusable UI components
- src/pages/ — Route-level page components
- src/lib/ — Business logic, utilities, Supabase client
- src/hooks/ — Custom React hooks
- src/i18n/ — Translation files (en/, he/)
- supabase/functions/ — Edge Functions
- supabase/migrations/ — Database migrations
- tests/ — Unit and component tests (Vitest)
- e2e/ — End-to-end tests (Playwright)

## Conventions
- All components are functional with hooks
- Use TypeScript strict mode
- Tailwind for all styling (no CSS files)
- RTL support: use logical properties (ms-, me-, ps-, pe-) not directional (ml-, mr-)
- All user-facing strings go through i18n (react-i18next)
- Supabase RLS policies enforce household-level access

## Data Models
- Vouchers: id, name, value, issuer, expiry_date, code, image_url, notes, household_id
- Reservations: id, name, event_date, time, address, image_url, notes, household_id
- Bills: id, vendor_name, amount, due_date, billing_period, payment_link, pdf_url, status, household_id
- Tasks: id, title, description, urgency, status, assignee_id, sub_hub_id, household_id

## Testing
- Unit/Component: Vitest + React Testing Library
- E2E: Playwright
- Run: npm test (unit), npm run test:e2e (playwright)

## DO NOT
- Do not use inline styles
- Do not hardcode strings (use i18n keys)
- Do not use ml-/mr-/pl-/pr- (use ms-/me-/ps-/pe- for RTL)
- Do not store sensitive tokens in localStorage
- Do not skip TypeScript types (no `any`)

## Bug & Issue Protocol

### When an agent finds a bug:
1. Create a bug task JSON in the responsible agent's folder
   - Naming: `{original-task-id}-bug-{NNN}.json` (e.g., `fe-001-bug-001.json`)
   - Set `priority` based on severity (critical = blocks release, high = blocks other tasks, medium = cosmetic)
   - Include: root cause description, steps to reproduce, affected files
2. Create a handoff in `agents/handoffs/`
   - Type: `bug_report`
   - Reference the original task and the new bug task
3. If the bug blocks your current task, set your task status to `blocked` and reference the bug in `open_questions`
4. If the bug doesn't block you, continue your work and note it in your `completion_summary`

### When an agent receives a bug to fix:
1. Set the bug task status to `in_progress`
2. Fix the issue
3. Add a regression test (or request QA to add one)
4. Set bug task status to `review`
5. Create a handoff back to QA for re-validation

### Severity Guide:
- **critical**: App crashes, data loss, security issue → drop everything
- **high**: Feature doesn't work, blocks other tasks → fix before moving on
- **medium**: Visual glitch, minor UX issue → fix in current phase
- **low**: Nice-to-have, polish → backlog it

## Architect Rules
- After every migration, verify: tables created, columns correct, RLS enabled, data migrated
- Log verification results in the task JSON completion_summary

## Coordinator Duties

### After Every Wave Completion
When told that tasks are complete, the Coordinator MUST do ALL of the following in order:

1. **Update task JSONs**: Set completed tasks to status "done" in their JSON files
2. **Process handoffs**: Check if completed tasks have deliverables for other agents. If yes, create handoff JSONs in agents/handoffs/
3. **Unblock tasks**: Check all "blocked" tasks — if their dependencies are now done, update them to "todo"
4. **Update BOARD.md** — every section:
   - Wave Tracker: mark current wave as done, queue next wave
   - Phase Progress Bars: recalculate percentages
   - Human Action Queue: add any pending human actions from completed tasks
   - Active Agents: clear completed, show next assignments
   - Task Board: update all statuses
   - Completed Log: add finished tasks with timestamps
5. **Report next wave**: List which tasks are now unblocked and recommend the next wave composition with agent assignments
6. **Sign off** using Coordinator color (yellow)

- The Coordinator NEVER writes application code
- The Coordinator NEVER executes tasks from other agents
- The Coordinator ONLY reads/writes files in agents/
- If asked to "continue" or "start" a wave, respond with the commands the human should run — do NOT execute the tasks yourself

### Coordinator Command Shortcut
When the human says "coordinator update" or "update board", run the full sequence above.
When the human says "status", just read and report BOARD.md without changes.

## Handoff Protocol
- Every agent must check agents/handoffs/ for pending handoffs addressed to them BEFORE starting work
- If you produce files that another agent needs, create a handoff JSON in agents/handoffs/

## Agent Output Protocol

### Agent Identity & Colors
Each agent has an assigned ANSI color for terminal output:

| Agent | Emoji | Color | ANSI Code |
|-------|-------|-------|-----------|
| Coordinator | 🎯 | Yellow | \033[1;33m |
| Architect | 🏗️ | Blue | \033[1;34m |
| Frontend | 🎨 | Magenta | \033[1;35m |
| Backend | ⚙️ | Cyan | \033[1;36m |
| QA | 🧪 | Green | \033[1;32m |

When signing off or alerting, use your assigned color by wrapping output in a shell echo command:

### Sign-off (use your agent color)
When you complete a task, run this command with YOUR color code:
```bash
echo -e "\033[1;35m\n===================================\n✅ 🎨 FRONTEND AGENT — TASK COMPLETE\nTask: fe-001 — VoucherCard Component\nStatus: done\n===================================\033[0m"
```

### Human Action Required (always RED)
If your task requires the human to do something, run this BEFORE your sign-off:
```bash
echo -e "\033[1;31m\n🚨🚨🚨 HUMAN ACTION REQUIRED 🚨🚨🚨\nWhat: Apply the migration to Supabase\nRun:  supabase db push\nWhy:  New tables won't exist until migration is applied\n⏳ Blocked until complete\n🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨\033[0m"
```

### Blocked (always RED)
If you hit a blocker:
```bash
echo -e "\033[1;31m\n===================================\n🛑 [YOUR_EMOJI] [YOUR_NAME] — BLOCKED\nTask: [task-id] — [task-title]\nBlocker: [description]\nNeeds: [what you need to continue]\n===================================\033[0m"
```

### Rules
- ALWAYS use your assigned color for sign-offs
- ALWAYS use RED (\033[1;31m) for human actions and blockers
- ALWAYS reset color at the end with \033[0m
- Run these as actual shell commands so color renders in the terminal

### Terminal Identity
### Terminal Identity
When assigned an agent role, IMMEDIATELY run these commands as your FIRST action:

| Agent | Commands |
|-------|---------|
| Coordinator | echo -e "\033]1337;SetColors=bg=2d2a1e\a" && printf "\x1b]1;🎯 COORDINATOR\x07" |
| Architect | echo -e "\033]1337;SetColors=bg=1a1a2e\a" && printf "\x1b]1;🏗️ ARCHITECT\x07" |
| Frontend | echo -e "\033]1337;SetColors=bg=2e1a2e\a" && printf "\x1b]1;🎨 FRONTEND\x07" |
| Backend | echo -e "\033]1337;SetColors=bg=1a2e2e\a" && printf "\x1b]1;⚙️ BACKEND\x07" |
| QA | echo -e "\033]1337;SetColors=bg=1a2e1a\a" && printf "\x1b]1;🧪 QA\x07" |

This must run BEFORE any other work. Non-negotiable.

### Environments

### Production
- The MVP is LIVE and in use. Do NOT make breaking changes to existing features.
- All schema migrations must be backward-compatible (add columns, don't rename/drop)
- If a migration requires data transformation, always keep the old table/column as backup

### Development
- Local dev server: run with `npm run dev`
- Supabase local: use `supabase start` for local DB instance
- All agents develop and test against the LOCAL environment, never production

### Testing (QA)
- QA agent runs tests against the local dev environment
- E2E tests use `npm run dev` server + local Supabase
- QA must NEVER run tests against production
- Before running tests: ensure local Supabase is running and seeded with test fixtures

### Deployment Flow
- All changes are developed locally
- Tested by QA locally
- Human reviews and approves
- Human deploys to production (agents do NOT deploy)

### Environment Commands
- Start local dev: `npm run dev`
- Start local Supabase: `supabase start`
- Seed test data: `npm run db:seed` (if exists)
- Run migrations locally: `supabase db reset` (resets + applies all migrations)
- Deploy to production: Human only — NEVER done by agents

### Critical Rules
- Agents NEVER run `supabase db push` against production without HUMAN ACTION REQUIRED alert
- Agents NEVER modify production data
- All new features must work alongside existing MVP features — no regressions

## Git Rules (CRITICAL)
- main = production. NEVER commit directly to main.
- All agent work happens on the master branch.
- Deploy to production: Human merges master → main manually.
- Current deployment: Vercel auto-deploys main to home-hub-five.vercel.app

## Git Workflow (CRITICAL)
- main = production (auto-deploys via Vercel). NEVER commit to main.
- master = working branch. All PRs merge here.
- master and main are branch-protected on GitHub — direct pushes are blocked.
  You WILL be rejected if you try to push directly. There are no exceptions.

### Mandatory steps BEFORE writing any code:
```bash
git checkout master
git pull origin master
git checkout -b agent/{task-id}-{short-description}
```
Do not skip this. Do not write a single line of code before your branch is created.

### While working:
- Commit frequently to your feature branch
- Keep commits focused and descriptive: `{task-id}: {what changed}`

### When task is complete:
```bash
git add -A
git commit -m "{task-id}: {description}"
git push origin agent/{task-id}-{short-description}
```
Then fire the HUMAN ACTION REQUIRED alert — the human will review and merge the PR.

### Rules (enforced by GitHub):
- NEVER push to master or main directly — you will be rejected
- NEVER merge your own PR
- NEVER commit directly to master or main

## Merge Conflict Protocol
- After a PR is merged into master, all active agents must pull latest:
  git checkout master && git pull origin master
  git checkout agent/{your-branch} && git merge master
- If conflicts arise, the agent resolves them and commits