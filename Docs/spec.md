# Mission 12 & 13: Performance & Reliability Specification

## 1. Context & Constraints

- **Objective:** Optimize Relay for speed (caching/optimistic UI) and reliability (error boundaries) to support 80 concurrent users.
- **Tech Stack:** React 19, Flask, Python-cachelib (or simple Dict-based caching).
- **Builder Autonomy Level:** Low. Follow surgical optimization phases.
- **Dependency Diet:**
  - Standard React Error Boundaries.
  - No heavy state management (use existing Context).
  - Simple in-memory cache for the backend.
- **Constraints:**
  - Caching must not serve stale data for critical updates (e.g., status changes must invalidate cache).
  - Optimistic UI must rollback if the backend request fails.

## 2. Architecture & Data Model

- **Backend Caching:**
  - Implement a `JIRA_CACHE` dictionary in `jira_service.py`.
  - Cache duration: 5 minutes for issue lists.
  - TTL (Time-to-Live): Invalidate cache on any `PUT` or `POST` request to that issue.
- **Frontend Reliability:**
  - Global `ErrorBoundary` component.
  - `SkeletonLoader` for smoother transitions.

## 3. Implementation Plan (Atomic & Phased)

### Phase 1: Backend Caching Bridge

- **Goal:** Reduce Jira API calls for frequently viewed issue lists.
- **Files to Modify:**
  - [MODIFY] `backend/api/services/jira_service.py`
    - Logic: Wrap `fetch_issues` with a simple cache check.
    - Logic: In `update_issue` and `transition_issue`, clear the cache for that project/list.
- **Stop Condition:** Successive refreshes of the issue list show "Cache Hit" in logs and load < 100ms.

### Phase 2: Optimistic UI (Status/Priority)

- **Goal:** Make status transitions feel instant.
- **Files to Modify:**
  - [MODIFY] `frontend/src/pages/IssueDetail.tsx` and `Issues.tsx`
    - Logic: Update the local state _before_ the API call finishes.
    - Logic: If the API fails, catch the error and revert the state to the previous value.
- **Stop Condition:** Clicking a status transition updates the UI badge without waiting for the spinner.

### Phase 3: Global Resilience (Errors & Empty States)

- **Goal:** Prevent "White Screen of Death" for users.
- **Files to Create/Edit:**
  - [NEW] `frontend/src/components/ui/ErrorBoundary.tsx`: Wrapper for app-level crashes.
  - [MODIFY] `frontend/src/App.tsx`: Wrap the main router.
  - [MODIFY] `frontend/src/pages/Issues.tsx`: Implement improved "Empty State" UI.
- **Stop Condition:** Manually triggering an error (e.g., in a component) shows a "Relay Encountered a Problem" screen instead of a crash.

## 4. Verification & Testing

- **Failure Modes:**
  - Backend fails during optimistic update -> Expect UI to flicker back and show error toast.
  - Stale Cache -> Verify that updating an issue summary immediately reflects in the list.
- **Success Scenarios:**
  - Navigating back to the issue list feels instantaneous compared to before.

## 5. Usage Optimization & Surgical Development

- **Target Files:** `backend/api/services/jira_service.py`, `frontend/src/pages/IssueDetail.tsx`, `frontend/src/App.tsx`.
- **Note:** Do not introduce Redis or heavy caching infrastructure unless memory becomes an issue.
