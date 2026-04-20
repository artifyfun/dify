# feature/shsnc_v1.11.4 to 1.14.0-rc1 Merge Assessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Determine whether the user-authored changes on `feature/shsnc_v1.11.4` can be merged or ported into `refs/heads/1.14.0-rc1` with acceptable conflict and regression risk.

**Architecture:** Perform a non-destructive assessment in an isolated worktree rooted at `refs/heads/1.14.0-rc1`. Analyze the feature branch as commit clusters instead of one opaque branch merge, then validate each cluster with conflict simulation and targeted code review before any migration recommendation.

**Tech Stack:** Git, zsh, Python/Flask backend under `api`, Next.js/TypeScript frontend under `web`, `pnpm`, `uv`, project Makefile.

---

## Current Findings

- `1.14.0-rc1` is ambiguous in this repo because both a tag and a branch exist. All future commands must use `refs/heads/1.14.0-rc1`.
- The user-authored branch contains 10 commits after `1.11.4`.
- The branch is not a clean merge candidate by default because many touched files also changed on `refs/heads/1.14.0-rc1`.
- One feature-branch file no longer exists on the target branch: `web/next.config.js`.
- Highest-risk overlap areas are backend feature/auth plumbing and frontend chat or embedded-chatbot components.

## Commit Clusters To Assess

### Cluster A: Branding, no-header, feature flags, enterprise plumbing

**Commits:**
- `21b4ec4b7a` `[shsnc] 支持定制品牌，免登录，无Header展示等`

**Primary files:**
- `api/configs/enterprise/__init__.py`
- `api/configs/feature/__init__.py`
- `api/extensions/ext_login.py`
- `api/libs/login.py`
- `api/services/enterprise/base.py`
- `api/services/enterprise/enterprise_service.py`
- `api/services/feature_service.py`
- `api/services/plugin/plugin_service.py`
- `web/app/components/header/header-wrapper.tsx`
- `web/types/feature.ts`
- `web/next.config.js`

### Cluster B: Automatic webapp login

**Commits:**
- `31daa51b3c` `feat: Implement automatic web app login flow with loading state when authentication is disabled.`

**Primary files:**
- `web/app/(shareLayout)/webapp-signin/page.tsx`

### Cluster C: Markdown custom buttons

**Commits:**
- `cac0b69744` `feat: Implement custom markdown buttons...`
- `4ff0128c85` `修改自定义按钮文字颜色为主题色`
- `4457f871eb` `新增自定义按钮样式`

**Primary files:**
- `web/app/components/base/chat/chat/answer/basic-content.tsx`
- `web/app/components/base/markdown-blocks/button.tsx`
- `web/app/components/base/markdown/index.tsx`
- `web/app/components/base/markdown/markdown-utils.ts`

### Cluster D: Embedded chatbot behavior and layout

**Commits:**
- `7a7169f111` `chatbot内嵌页面支持隐藏头部工具栏，并支持外部事件控制`
- `4d9f82ffbe` `推荐问题放到输入框上方展示，支持外部控制参数更新，重置对话等`
- `b65aadf8cd` `修复开场白的渲染逻辑`
- `c55ae1f35d` `fix: fix chat footer width 0 in embedded mode...`

**Primary files:**
- `web/app/components/base/chat/chat/index.tsx`
- `web/app/components/base/chat/chat/question.tsx`
- `web/app/components/base/chat/chat/answer/index.tsx`
- `web/app/components/base/chat/chat-with-history/chat-wrapper.tsx`
- `web/app/components/base/chat/embedded-chatbot/chat-wrapper.tsx`
- `web/app/components/base/chat/embedded-chatbot/context.tsx`
- `web/app/components/base/chat/embedded-chatbot/hooks.tsx`
- `web/app/components/base/chat/embedded-chatbot/index.tsx`
- `web/app/components/base/answer-icon/index.tsx`

### Cluster E: Public URL port handling

**Commits:**
- `6a18ef7fe1` `公开访问URL缺少端口号的容错处理`

**Primary files:**
- `web/utils/index.ts`
- `web/service/common.ts`
- `web/app/components/app/app-publisher/index.tsx`
- `web/app/components/app/overview/app-card.tsx`
- `web/app/components/develop/index.tsx`

## Task 1: Prepare Isolated Assessment Workspace

**Files:**
- Observe: `.git/`, worktree metadata only

- [ ] **Step 1: Create a dedicated worktree from the branch ref, not the tag**

Run:

```bash
git worktree add ../dify-merge-assess-shsnc refs/heads/1.14.0-rc1 -b codex/assess-shsnc-1-14-0-rc1
```

Expected:
- New worktree at `../dify-merge-assess-shsnc`
- New temp branch `codex/assess-shsnc-1-14-0-rc1`

- [ ] **Step 2: Record the exact source range and target SHA**

Run:

```bash
git rev-parse feature/shsnc_v1.11.4
git rev-parse refs/heads/1.14.0-rc1
git log --reverse --format='%h %s' 1.11.4..feature/shsnc_v1.11.4
```

Expected:
- A stable source head SHA
- A stable target head SHA
- The 10 source commits listed in chronological order

- [ ] **Step 3: Snapshot overlap and missing-path risk before any apply attempt**

Run:

```bash
comm -12 <(git diff --name-only 1.11.4..feature/shsnc_v1.11.4 | sort) <(git diff --name-only 1.11.4..refs/heads/1.14.0-rc1 | sort)
for f in $(git diff --name-only 1.11.4..feature/shsnc_v1.11.4); do git cat-file -e refs/heads/1.14.0-rc1:$f 2>/dev/null || echo "MISSING:$f"; done
```

Expected:
- A list of overlapping files requiring manual review
- At least one missing target path: `web/next.config.js`

## Task 2: Review Target-Side Refactors In High-Risk Files

**Files:**
- Inspect: `api/configs/feature/__init__.py`
- Inspect: `api/libs/login.py`
- Inspect: `api/services/enterprise/base.py`
- Inspect: `api/services/enterprise/enterprise_service.py`
- Inspect: `api/services/feature_service.py`
- Inspect: `web/app/(shareLayout)/webapp-signin/page.tsx`
- Inspect: `web/app/components/base/chat/chat/index.tsx`
- Inspect: `web/app/components/base/chat/chat/question.tsx`
- Inspect: `web/app/components/base/chat/embedded-chatbot/chat-wrapper.tsx`
- Inspect: `web/app/components/base/chat/embedded-chatbot/index.tsx`
- Inspect: `web/app/components/base/markdown/index.tsx`
- Inspect: `web/types/feature.ts`

- [ ] **Step 1: Measure how far the target moved in overlapping hotspots**

Run:

```bash
git diff --stat 1.11.4..refs/heads/1.14.0-rc1 -- api/configs/feature/__init__.py api/libs/login.py api/services/enterprise/base.py api/services/enterprise/enterprise_service.py api/services/feature_service.py 'web/app/(shareLayout)/webapp-signin/page.tsx' web/app/components/base/chat/chat/index.tsx web/app/components/base/chat/chat/question.tsx web/app/components/base/chat/embedded-chatbot/chat-wrapper.tsx web/app/components/base/chat/embedded-chatbot/index.tsx web/app/components/base/markdown/index.tsx web/types/feature.ts
```

Expected:
- Enough churn data to rank hotspots before attempting any cherry-pick

- [ ] **Step 2: Read the target implementations for incompatible API or prop changes**

Run:

```bash
git show refs/heads/1.14.0-rc1:api/services/feature_service.py | sed -n '1,220p'
git show refs/heads/1.14.0-rc1:api/libs/login.py | sed -n '1,220p'
git show refs/heads/1.14.0-rc1:web/app/components/base/chat/embedded-chatbot/index.tsx | sed -n '1,260p'
git show refs/heads/1.14.0-rc1:web/app/components/base/chat/chat/index.tsx | sed -n '1,260p'
```

Expected:
- A list of renamed functions, changed props, moved state, and deleted integration points

- [ ] **Step 3: Record path replacement for deleted `web/next.config.js` behavior**

Run:

```bash
git ls-tree -r --name-only refs/heads/1.14.0-rc1 | rg '^web/.+config'
git log --follow -- web/next.config.js | sed -n '1,40p'
```

Expected:
- The new home of any equivalent config behavior on the target branch, or confirmation that the old change must be reinterpreted instead of cherry-picked

## Task 3: Simulate Mergeability By Cluster, Not By Whole Branch

**Files:**
- Apply in temp worktree only

- [ ] **Step 1: Simulate Cluster A on the temp branch**

Run in the assessment worktree:

```bash
git cherry-pick -n 21b4ec4b7a
git status --short
git diff --name-only --diff-filter=U
```

Expected:
- Either a clean apply, or an explicit conflict list

- [ ] **Step 2: Abort the simulation and reset the temp branch to target**

Run in the assessment worktree:

```bash
git cherry-pick --abort || true
git reset --hard refs/heads/1.14.0-rc1
```

Expected:
- Clean assessment branch back at target head

- [ ] **Step 3: Repeat the same simulation for the other clusters**

Run in the assessment worktree:

```bash
git cherry-pick -n 31daa51b3c
git cherry-pick --abort || true
git reset --hard refs/heads/1.14.0-rc1

git cherry-pick -n cac0b69744 4ff0128c85 4457f871eb
git cherry-pick --abort || true
git reset --hard refs/heads/1.14.0-rc1

git cherry-pick -n 7a7169f111 4d9f82ffbe b65aadf8cd c55ae1f35d
git cherry-pick --abort || true
git reset --hard refs/heads/1.14.0-rc1

git cherry-pick -n 6a18ef7fe1
git cherry-pick --abort || true
git reset --hard refs/heads/1.14.0-rc1
```

Expected:
- A conflict matrix per cluster
- Early identification of clean cherry-pick candidates versus manual-port candidates

## Task 4: Review Semantic Compatibility Where Cherry-Pick Alone Is Not Enough

**Files:**
- Inspect feature and target versions for all files that conflict in Task 3

- [ ] **Step 1: Compare source and target implementations for each conflicting file**

Run:

```bash
git diff refs/heads/1.14.0-rc1...feature/shsnc_v1.11.4 -- web/app/components/base/chat/chat/index.tsx
git diff refs/heads/1.14.0-rc1...feature/shsnc_v1.11.4 -- web/app/components/base/chat/embedded-chatbot/index.tsx
git diff refs/heads/1.14.0-rc1...feature/shsnc_v1.11.4 -- api/services/feature_service.py
git diff refs/heads/1.14.0-rc1...feature/shsnc_v1.11.4 -- api/libs/login.py
```

Expected:
- Clear separation between business intent worth preserving and obsolete implementation details that should be dropped

- [ ] **Step 2: Decide the migration mode for each cluster**

Use these rules:
- Clean cherry-pick: no conflicts and no semantic drift in touched APIs
- Manual port: conflicts exist but business behavior is still needed on `1.14.0-rc1`
- Drop: target branch already implements the behavior differently or the integration point no longer exists

Expected:
- One migration mode assigned to each of Clusters A-E

## Task 5: Validate Any Candidate Port In The Target Environment

**Files:**
- Modify only after a cluster is approved for migration

- [ ] **Step 1: Run frontend checks if any `web/` file is ported**

Run:

```bash
cd web
pnpm lint:fix
pnpm type-check:tsgo
pnpm test
```

Expected:
- Lint, type-check, and tests pass for the migrated branch

- [ ] **Step 2: Run backend checks if any `api/` file is ported**

Run:

```bash
make lint
make type-check
uv run --project api --dev dev/pytest/pytest_unit_tests.sh
```

Expected:
- Backend quality gates pass after the port

- [ ] **Step 3: Record runtime smoke checks for user-visible behavior**

Validate:
- Webapp sign-in auto-login when authentication is disabled
- Embedded chatbot header visibility toggle
- External event control and reset flow
- Suggested questions position and greeting rendering
- Markdown custom button rendering and actions
- Public URL port fallback handling

Expected:
- A pass/fail table tied back to the migrated clusters

## Task 6: Produce The Merge Recommendation

**Files:**
- Create: `docs/superpowers/plans/assessment-notes/feature-shsnc-v1.11.4-to-1.14.0-rc1.md` only if execution starts

- [ ] **Step 1: Summarize the final recommendation in one of three outcomes**

Use exactly one:
- Direct merge acceptable
- Selective cherry-pick plus manual port recommended
- Full manual reimplementation on `refs/heads/1.14.0-rc1` required

- [ ] **Step 2: For each outcome, include evidence**

Must include:
- Conflict matrix by cluster
- Deleted or moved target integration points
- Checks run and their outcomes
- Residual regression risks

## Preliminary Recommendation Before Execution

- Do not merge `feature/shsnc_v1.11.4` wholesale into `refs/heads/1.14.0-rc1`.
- Start with selective cluster assessment.
- Expect Cluster E to be the easiest candidate.
- Expect Clusters A and D to have the highest manual-port cost.
- Treat `web/next.config.js` as a redesign item, not a straight cherry-pick.
