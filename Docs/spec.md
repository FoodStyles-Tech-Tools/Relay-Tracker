# Mission 14: UX Polish & Cleanup (Refined)

## 1. Context & Constraints

- **Objective:** Update the application to implement specific BEB recording guidance.
- **Tech Stack:** React, Tailwind, Supabase (Auth only).

## 2. Implementation Plan

### Phase 2: BEB Recording Instructions (Refined)

- **Goal:** Provide clear instructions for reporting performance issues without spamming the Jira description.
- **Backend Change:**
  - [MODIFY] `backend/api/utils/template_builder.py`: **Remove** the hardcoded "IF YOU ARE EXPERIENCING SLOWDOWNS..." legacy text block.
- **Frontend Change:**
  - [MODIFY] `frontend/src/components/issues/CreateIssueModal.tsx`: **Add** a contextual "Info Alert" (blue) above the attachments section.
  - **Text:** "Recording Performance Issues? If you are reporting a slowdown, please keep your BEB recording running, run a Speedtest, and then stop the recording."
  - [MODIFY] `frontend/src/pages/IssueDetail.tsx`: **Remove** the non-functional "Three Dots" menu button from the header.

## 3. Verification

- **Jira:** Created issues should _not_ contain the "SLOWDOWNS" text block in the description.
- **Create Modal:** Alert appears. Closing/reopening modal resets the form (no drafts).
