# Mission 6: Issue Creation (Surgical Implementation Spec)

## 1. Context & Constraints

- **Objective:** Implement the "New Issue" modal that handles the full bug reporting lifecycle.
- **Focus:** Pure passthrough to Jira with automatic environment detection.

## 2. Technical Map (Surgical)

- **Creation Component**: `src/components/issues/CreateIssueModal.tsx` [NEW]
- **Integration Point**: `src/pages/Issues.tsx` (Add modal state and trigger).
- **API Service**: `src/lib/api.ts` -> use existing `createIssue` function.
- **Backend Endpoint**: `POST /api/issues` (handled by `backend/api/routes/issues.py`).

## 3. Implementation Logic

- **Validation**:
  - `summary`: Required, max 255 chars.
  - `details`: Required, min 10 chars.
  - `type`/`priority`: Default to 'Bug'/'Medium'.
- **Handshake**:
  - Frontend: Send `summary`, `details`, `type`, `priority`, `attachmentLinks` in JSON.
  - Backend: Merges `details` into the SQA Template using `User-Agent`. No frontend environment detection needed.

## 4. Verification Flow

- **Redirection**: On successful creation (HTTP 201), the app MUST navigate to `/issues/<new-key>`.
- **Testing**: Linter must pass `npm run lint`.
