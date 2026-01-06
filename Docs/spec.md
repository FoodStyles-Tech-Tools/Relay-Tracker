# Mission 4 & 5: Issue Dashboard & Detail View Verification

## 1. Context & Constraints

- **Objective:** Verify the full "Read" lifecycle of Relay issues—from the filterable list to the deep detail view.
- **Focus:** Ensure UI precision, debounced search, and multi-pane detail rendering.

## 2. Architecture & Data Model

- **List View**: `/api/issues` with query params.
- **Detail View**: `/api/issues/<key>` with comments and history.

## 3. Verification & Testing (Optimized Suite)

- **Linter Check:** `npm run lint`.
- **CRITICAL Test Scenarios:**
  1. **"List Rendering & Search"**: "Navigate to Dashboard -> Enter search term -> Verify list filters correctly using debounced API call."
  2. **"Navigation & Detail View"**: "Click an issue in the list -> Verify transition to detail page -> Confirm SQA template renders correctly."
  3. **"Collaboration UI"**: "Verify comments and activity timeline are visible on the detail page."
  4. **"Role Enforcement"**: "Ensure 'Edit Status' buttons are NOT visible for standard users."

> [!NOTE]
> We are grouping these two missions for verification to save usage, as they share the same underlying data flow.
