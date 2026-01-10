# 🚀 RELAY - Complete Project Specification

**App Name**: Relay  
**Tagline**: "Fast track from report to resolution"  
**Purpose**: Replace Jira Service Management with a custom bug/task tracking webapp that connects to Jira Cloud

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Users & Roles](#users--roles)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Jira SQA Template](#jira-sqa-template-format)
6. [Notifications](#notifications)
7. [MVP Features](#mvp-features-phase-1)
8. [Branding](#branding)
9. [Environment Variables](#environment-variables-needed)
10. [Database Schema](#database-schema-supabase)
11. [Antigravity Mission Plan](#-antigravity-mission-plan-10-missions)
12. [Setup Requirements](#-setup-requirements)

---

## PROJECT OVERVIEW

### THE PROBLEM

- Currently using Jira Service Management (JSM) for 80 users to report bugs/tasks
- JSM is too simplistic - no dashboards, limited filters, not customizable
- Users submit 1-2 reports daily
- Need a modern UI we can customize at will

### THE SOLUTION

Build "Relay" - a custom webapp that:

- Provides beautiful, modern UI for users
- Stores ALL data in Jira Cloud (pure passthrough architecture)
- Syncs bidirectionally with Jira Cloud in real-time
- Is fully customizable for our needs

---

## USERS & ROLES

**Total Users**: ~80 users, daily usage (1-2 reports/day)

**3 Roles** (separate permission logic from Jira):

| Role      | Permissions                                                    |
| --------- | -------------------------------------------------------------- |
| **User**  | Create tickets, view all tickets, edit/cancel own tickets only |
| **SQA**   | All User permissions + edit any ticket + bulk operations       |
| **Admin** | All SQA permissions + delete tickets + manage users/roles      |

---

## TECH STACK

### Frontend

- **React 19** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Lucide React** (icons)
- **Google Auth** (Direct OAuth 2.0 Identity Tokens)

### Backend

- **Python Flask** (serverless on Vercel)
- **libsql** (Edge-ready SQLite for Turso)
- **Jira Cloud REST API v3**

- **Turso (libsql)** (User roles, preferences, activity logs)
- **Direct Google OAuth** (Identity tokens without a broker)

### Hosting & Services

- **Vercel** (frontend + backend serverless)
- **SendGrid** (email notifications - free tier: 100/day)
- **Discord Webhooks** (notifications)

### Budget

- **$0/month** (all free tiers)

---

## ARCHITECTURE

### Data Flow

```
USER → Relay Frontend → Flask API → Jira Cloud API
                                  ↓
                              Turso (preferences/roles only)
```

### Real-time Sync Strategy

- **Polling**: Frontend polls Flask API every 60 seconds for Jira updates
- **Why**: Simpler for MVP, no webhook setup complexity
- **Future**: Add webhooks in Phase 2 for true real-time

### Jira Integration

- **Project**: Single Jira project (where devs work)
- **Issue Types**: Bug, Task, Story
- **Sync**: All changes in Jira Cloud instantly visible in Relay (via polling)
- **Template**: User's simple form → Flask transforms to SQA template → Creates in Jira

---

## JIRA SQA TEMPLATE FORMAT

When users submit a simple form, Flask transforms it into this template in Jira:

```
*ENVIRONMENT:*
Browser: {auto-detected}
OS: {auto-detected}

*STEPS TO REPRODUCE:*
[To be filled by SQA]

*EXPECTED RESULT:*
[To be filled by SQA]

*ACTUAL RESULT:*
[To be filled by SQA]

*PLEASE SEE (BEB LINK):*
{attachment_links}

*(FOR SQA ONLY) WATCHERS:*
[To be filled by SQA]

*(FOR SQA ONLY) DEVELOPERS (IF PRIORITY IS HIGHEST OR HIGH):*
[To be filled by SQA]

---
*USER PROVIDED INFORMATION:*

*Summary:* {user_summary}

*Details:* {user_details}

*Priority:* {priority}

*Reporter:* {user_email}

*Reported via:* Relay App
*Timestamp:* {datetime}

---
*IF YOU ARE EXPERIENCING SLOWDOWNS READ THIS:*
1. During our BEB recording, without stopping it, open the link to Ookla's Speedtest.
2. Press the "GO" button.
3. Wait until the test is finished.
4. Finish the BEB recording.
Note: Please share the whole screen and not just a tab when recording so BEB can catch what happens during the speed test.
```

---

## NOTIFICATIONS

### Email Notifications (SendGrid - 100/day limit)

Send emails for:

1. ✅ **Ticket created** (confirmation to reporter)
2. ✅ **Status changed** (e.g., Open → Done)
3. ✅ **SQA/Dev commented** on your ticket

Respect user preferences (can toggle on/off in settings)

### Discord Notifications

**3 separate channels by type:**

- `#bugs` - All bug reports
- `#tasks` - All tasks
- `#stories` - All stories

**Message format:**

```
🐛 [HIGH] New Bug #BUG-123
**Summary:** Dashboard not loading
**Reporter:** john@company.com
**Created:** 2 minutes ago
[View in Relay](link) | [View in Jira](link)
```

---

## MVP FEATURES (Phase 1)

### Core Features

- ✅ Google SSO login (Direct Google OAuth)
- ✅ Simple create form (summary, details, priority, type, attachments)
- ✅ View all tickets (list view)
- ✅ Filter by: Status, Priority, Type, Reporter
- ✅ Search by title/description
- ✅ View ticket details
- ✅ Edit own tickets (users) / Edit any ticket (SQA/Admin)
- ✅ Add comments
- ✅ Cancel own ticket
- ✅ Polling sync (60-second refresh from Jira)
- ✅ Email notifications (created, status changed, commented)
- ✅ Discord notifications (separate channels by type)
- ✅ Responsive design (mobile-friendly)
- ✅ Basic dashboard with stats

### Future Phase 2 Features (NOT in MVP)

- AI-powered duplicate detection
- Webhooks for true real-time sync
- Advanced analytics
- Custom fields
- Automation rules

---

## BRANDING

**Name**: Relay  
**Colors**: Orange/Red gradient (#FF6B35 → #F7931E)  
**Logo**: Signal waves or relay baton icon  
**Style**: Modern, fast, glassmorphism, clean  
**Vercel URL**: `relay-tracker.vercel.app`

---

## ENVIRONMENT VARIABLES NEEDED

### Backend (.env)

```env
JIRA_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=YOUR_PROJECT_KEY
TURSO_DATABASE_URL=libsql://relay-db-yourname.turso.io
TURSO_AUTH_TOKEN=your-turso-token
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
SENDGRID_API_KEY=your-sendgrid-key
DISCORD_WEBHOOK_BUGS=your-discord-webhook-url
DISCORD_WEBHOOK_TASKS=your-discord-webhook-url
DISCORD_WEBHOOK_STORIES=your-discord-webhook-url
```

### Frontend (.env)

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000
```

---

-- User preferences
CREATE TABLE user_preferences (
user_id TEXT PRIMARY KEY,
email_notifications INTEGER DEFAULT 1,
discord_notifications INTEGER DEFAULT 1,
theme TEXT DEFAULT 'light',
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User roles (separate from Jira)
CREATE TABLE user_roles (
user_id TEXT PRIMARY KEY,
email TEXT NOT NULL,
role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'sqa', 'admin')),
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activity log
CREATE TABLE activity_log (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT,
action TEXT NOT NULL,
jira_issue_key TEXT,
metadata TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

```

**Note**: First user to sign up automatically gets 'admin' role

---

## 🤖 ANTIGRAVITY MISSION PLAN (10 Missions)

### MISSION 1: Project Foundation (3-4h review time)

```

Set up full-stack project for "Relay" - a bug/task tracking app.

FRONTEND SETUP:

- React 19 + TypeScript + Vite
- Tailwind CSS configured with orange/red gradient theme (#FF6B35 → #F7931E)
- Lucide React icons installed
- Project structure:
  src/
  components/
  pages/
  lib/
  hooks/
  types/
  App.tsx
  main.tsx
- Dark/Light mode toggle
- Responsive layout framework
- Loading states component
- Error boundary

BACKEND SETUP:

- Python Flask app
- Project structure:
  api/
  routes/
  services/
  utils/
  models/
  index.py
- vercel.json configuration for serverless deployment
- requirements.txt with dependencies:
  - Flask
  - flask-cors
  - supabase
  - atlassian-python-api
  - python-dotenv
  - requests
- Environment variables setup (.env.example)
- CORS configured for localhost + Vercel
- Health check endpoint: GET /api/health

ENVIRONMENT VARIABLES NEEDED:
Backend (.env):

- JIRA_URL=https://yourcompany.atlassian.net
- JIRA_EMAIL=your-email@company.com
- JIRA_API_TOKEN=your-token
- JIRA_PROJECT_KEY=YOUR_PROJECT
- SUPABASE_URL=your-supabase-url
- SUPABASE_KEY=your-supabase-key
- SENDGRID_API_KEY=your-sendgrid-key
- DISCORD_WEBHOOK_BUGS=webhook-url
- DISCORD_WEBHOOK_TASKS=webhook-url
- DISCORD_WEBHOOK_STORIES=webhook-url

Frontend (.env):

- VITE_SUPABASE_URL=your-supabase-url
- VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
- VITE_API_URL=http://localhost:5000

BRANDING:

- App name: Relay
- Primary colors: Orange/Red gradient
- Style: Modern, glassmorphism, fast

DELIVERABLES:

- Both projects running locally
- README.md with setup instructions
- .env.example files
- Clean folder structure
- Git repository initialized (relay-frontend, relay-backend)

```

---

### MISSION 2: Supabase Setup + Google SSO (4-5h review time)

```

Implement Google SSO authentication for Relay using Supabase.

DATABASE SCHEMA (Supabase SQL Editor):

-- User preferences
CREATE TABLE user_preferences (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
email_notifications BOOLEAN DEFAULT true,
discord_notifications BOOLEAN DEFAULT true,
theme TEXT DEFAULT 'light',
created_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(user_id)
);

-- User roles (separate from Jira permissions)
CREATE TABLE user_roles (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
role TEXT NOT NULL CHECK (role IN ('user', 'sqa', 'admin')),
created_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(user_id)
);

-- Activity log
CREATE TABLE activity_log (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES auth.users(id),
action TEXT NOT NULL,
jira_issue_key TEXT,
metadata JSONB,
created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

BACKEND (Flask):

- Supabase client initialization
- JWT verification middleware (@require_auth decorator)
- Role checking middleware (@require_role('sqa') decorator)
- Routes:
  POST /api/auth/verify - Verify Google token
  GET /api/auth/me - Get current user + role
  POST /api/auth/logout - Clear session
  GET /api/users - List all users (admin only)
  PUT /api/users/{id}/role - Update user role (admin only)

FRONTEND (React):

- Supabase Auth setup with Google provider
- Login page (clean, centered with Google button)
- Auth context/provider (useAuth hook)
- Protected routes component
- User profile dropdown in navbar
- Logout functionality
- Token refresh handling
- Role-based component rendering

DESIGN:

- Centered login card with glassmorphism
- "Sign in with Google" button with icon
- Orange/red accent colors
- Loading spinner during auth
- Error messages for failed auth
- Redirect to dashboard after login
- Navbar with user avatar + role badge

DEFAULT ADMIN:

- First user to sign up gets 'admin' role automatically
- Admins can assign 'sqa' or 'user' roles to others

PERMISSION MATRIX:

- User: Create tickets, view all, edit/cancel own only
- SQA: User permissions + edit any ticket + bulk operations
- Admin: SQA permissions + delete + manage users/roles

DELIVERABLES:

- Working Google SSO
- Role-based access control
- User management page (admin only)
- Persistent sessions

```

---

### MISSION 3: Jira Cloud API Integration (5-6h review time)

```

Build Flask service layer for Jira Cloud API with template transformation for Relay.

JIRA SERVICE (api/services/jira_service.py):

Core functions:

1. fetch_issues(filters=None, search=None)

   - Build JQL query from filters
   - Support: status, priority, type, reporter
   - Return paginated results (50 per page)
   - Include: key, summary, status, priority, assignee, reporter, created, updated

2. get_issue(issue_key)

   - Fetch single issue with all details
   - Include comments, attachments, history
   - Return formatted data

3. create_issue(issue_data, user_email)
   - Transform simple user input into SQA template
   - Auto-detect browser/OS from user agent
   - Template format (EXACT format required):

_ENVIRONMENT:_
Browser: {detected_browser}
OS: {detected_os}

_STEPS TO REPRODUCE:_
[To be filled by SQA]

_EXPECTED RESULT:_
[To be filled by SQA]

_ACTUAL RESULT:_
[To be filled by SQA]

_PLEASE SEE (BEB LINK):_
{attachment_links}

_(FOR SQA ONLY) WATCHERS:_
[To be filled by SQA]

_(FOR SQA ONLY) DEVELOPERS (IF PRIORITY IS HIGHEST OR HIGH):_
[To be filled by SQA]

---

_USER PROVIDED INFORMATION:_

_Summary:_ {user_summary}

_Details:_ {user_details}

_Priority:_ {priority}

_Reporter:_ {user_email}

_Reported via:_ Relay App
_Timestamp:_ {datetime}

---

_IF YOU ARE EXPERIENCING SLOWDOWNS READ THIS:_

1. During our BEB recording, without stopping it, open the link to Ookla's Speedtest.
2. Press the "GO" button.
3. Wait until the test is finished.
4. Finish the BEB recording.
   Note: Please share the whole screen and not just a tab when recording so BEB can catch what happens during the speed test.

5. update_issue(issue_key, fields)

   - Update status, priority, assignee, etc.
   - Validate user can only edit own issues (unless SQA/Admin)

6. add_comment(issue_key, comment_text, user_email)

   - Add comment with user attribution

7. upload_attachment(issue_key, file)

   - Handle file upload to Jira
   - Support: images, PDFs, videos, zip
   - Max size: 10MB

8. check_user_can_edit(issue_key, user_email)
   - Return true if user is reporter OR has SQA/Admin role

ERROR HANDLING:

- Retry logic (3 attempts with exponential backoff)
- Rate limiting awareness
- Meaningful error messages
- Log all Jira API calls

ROUTES (api/routes/issues.py):
GET /api/issues - List issues with filters
GET /api/issues/{key} - Get single issue
POST /api/issues - Create issue
PUT /api/issues/{key} - Update issue
POST /api/issues/{key}/comments - Add comment
POST /api/issues/{key}/attachments - Upload file
DELETE /api/issues/{key} - Cancel issue (admin only)

JIRA CONNECTION:

- Single project only
- Issue types: Bug, Task, Story
- Use Jira Cloud REST API v3
- Authentication: API token (Bearer auth)

DELIVERABLES:

- jira_service.py with all functions
- Template transformation working
- Browser/OS detection
- Error handling
- Unit tests for template generation

```

---

### MISSION 4: Issue List View + Filters (5-6h review time)

```

Create beautiful, filterable issue list for Relay matching our design system.

BACKEND:
GET /api/issues endpoint with query params:

- status: string (e.g., "Open,In Progress")
- priority: string (e.g., "Highest,High,Medium,Low,Lowest")
- type: string (e.g., "Bug,Task,Story")
- reporter: string (email)
- search: string (searches summary + description)
- page: number (default 1)
- limit: number (default 50)

Returns:
{
issues: [...],
total: number,
page: number,
totalPages: number
}

FRONTEND:
Design inspired by Linear/Notion with Relay branding:

- Clean table/list view
- Glassmorphism cards
- Orange/red accent colors
- Smooth animations

Each row shows:

- Issue key (clickable) - e.g., "BUG-123"
- Type icon (bug/task/story) with color
- Summary (truncated if long)
- Status badge (colored by status)
- Priority indicator (icon + color)
- Reporter avatar (from Google profile)
- Created date (relative: "2 hours ago")
- Updated date

Filter bar (sticky header):

- Multi-select dropdowns:
  - Status (Open, In Progress, In Review, Done, Cancelled)
  - Priority (Highest, High, Medium, Low, Lowest)
  - Type (Bug, Task, Story)
  - Reporter (dropdown of all users)
- Search input with debounce (300ms)
- "Clear filters" button
- Active filter count badge

Features:

- Infinite scroll OR pagination
- Loading skeletons
- Empty state: "No issues found. Try adjusting filters."
- Responsive (table on desktop, cards on mobile)
- Click row → navigate to detail view
- Keyboard navigation (arrow keys, enter to open)

State management:

- URL query params for filters (shareable links)
- Persist filter state in localStorage
- Auto-refresh every 60 seconds (polling from Jira)

DESIGN SPECS:

- Use Tailwind utilities
- Dark mode support
- Hover effects on rows
- Smooth transitions
- Status colors:
  - Open: blue
  - In Progress: yellow
  - In Review: purple
  - Done: green
  - Cancelled: gray
- Priority colors:
  - Highest: red
  - High: orange (#FF6B35)
  - Medium: yellow
  - Low: gray
  - Lowest: slate

DELIVERABLES:

- Issue list component
- Filter components
- Search component
- Pagination component
- Loading states
- Empty states
- Responsive design

```

---

### MISSION 5: Issue Detail View (4-5h review time)

```

Build detailed issue view for Relay with inline editing.

LAYOUT:
Split view or modal (your choice):

- Left: Issue details
- Right: Activity timeline + comments

ISSUE DETAILS SECTION:
Header:

- Issue key + type icon
- Summary (editable inline for own issues or if SQA/Admin)
- Status dropdown (changes status on select)
- Priority dropdown

Body:

- Description (show formatted SQA template from Jira)
- Attachments section (download buttons)
- Metadata:
  - Reporter (avatar + name)
  - Created date
  - Updated date
  - Assignee (editable by SQA/Admin)

EDIT FUNCTIONALITY:

- Click summary → edit mode
- Click description → rich text editor
- Auto-save on blur OR explicit Save button
- Show "Saving..." indicator
- Optimistic UI updates
- Permission check:
  - Users can edit own issues only
  - SQA/Admin can edit any issue

COMMENTS SECTION:

- List all comments (newest first)
- Each comment shows:
  - Author avatar + name
  - Timestamp (relative)
  - Comment text
  - "via Jira" badge if from dev
- Add comment box:
  - Text area
  - Attach files
  - Submit button
  - Shows "Posting..." state

ACTIVITY TIMELINE:

- Show recent changes:
  - Status changed: Open → In Progress
  - Priority changed: Medium → High
  - Comment added
  - Attachment added
- Timestamp for each event
- Icon for event type

ACTIONS:

- "Cancel Issue" button (for own issues - sets status to Cancelled)
- "Delete" button (admin only)
- "Copy Link" button
- "Open in Jira" button (new tab)

DESIGN:

- Clean typography
- Generous spacing
- Glassmorphism cards with orange/red accents
- Smooth animations
- Loading skeletons
- Error states

DELIVERABLES:

- Issue detail component
- Inline editing
- Comments component
- Activity timeline
- Permission-based UI

```

---

### MISSION 6: Create Issue Form (4-5h review time)

```

Build intuitive issue creation form for Relay with validation.

FORM DESIGN:
Modal or slide-over panel (your choice)

Steps:

1. Select Type (Bug/Task/Story) - large buttons with icons
2. Fill Details

FIELDS:

- Type selector (required)

  - Bug (red icon 🐛)
  - Task (blue icon 📋)
  - Story (green icon 📖)

- Summary (required)

  - Text input
  - Max 255 characters
  - Character counter
  - Validation: not empty
  - Placeholder: "Summarize the issue briefly"

- Details (required)

  - Rich text editor (simple toolbar)
  - Toolbar: Bold, Italic, List, Link
  - Placeholder: "Provide as much detail as possible about the issue"
  - Min 10 characters

- Priority (required)

  - Dropdown: Highest, High, Medium (default), Low, Lowest
  - Color indicators matching Relay branding
  - Helper text: "Select according to Issue Reporting SOP"

- Attachments (optional)
  - Drag & drop zone
  - File picker button
  - Multiple files allowed
  - Show preview for images
  - File size limit: 10MB per file
  - Allowed types: images, PDFs, videos, zip
  - Show upload progress
  - Helper text: "Attach screenshots, videos, or relevant files"

VALIDATION:

- Real-time validation on blur
- Show errors below fields in red
- Disable submit until all required fields valid
- Clear error messages:
  - "Summary is required"
  - "Details must be at least 10 characters"
  - "File size exceeds 10MB limit"

SUBMIT FLOW:

1. Click "Submit"
2. Validate all fields
3. Show loading spinner
4. Disable form
5. Call POST /api/issues (backend transforms to SQA template)
6. If success:
   - Show success toast: "Issue BUG-123 created!"
   - Send email notification
   - Send Discord notification to appropriate channel
   - Redirect to issue detail
   - Close modal
7. If error:
   - Show error message
   - Re-enable form
   - Don't lose form data

DESIGN:

- Progressive disclosure (type first, then details)
- Clear visual hierarchy
- Smooth transitions
- Glassmorphism with orange/red accents
- Dark mode support
- Mobile-friendly

DELIVERABLES:

- Create form component
- Validation logic
- File upload handling
- Success/error states
- Responsive design

```

---

### MISSION 7: Notifications System (5-6h review time)

```

Implement email + Discord notifications for Relay.

EMAIL NOTIFICATIONS (SendGrid - 100/day limit):

Backend service (api/services/notification_service.py):

send_email(to, subject, template_name, data):

- Use SendGrid API
- HTML email templates with Relay branding (orange/red colors)
- Track sent emails in activity_log

Templates needed:

1. issue_created.html

   - Subject: "Issue {key} created: {summary}"
   - Body: Issue details + link to view in Relay

2. status_changed.html

   - Subject: "Issue {key} status changed to {new_status}"
   - Body: Old status → New status + link

3. comment_added.html
   - Subject: "New comment on {key}"
   - Body: Comment text + commenter + link

Email triggers (only send if user has email_notifications = true):

- Issue created → Send to reporter
- Status changed → Send to reporter
- Comment added → Send to reporter (if someone else commented)

DISCORD NOTIFICATIONS:

3 separate webhooks for each type:

- DISCORD_WEBHOOK_BUGS → #bugs channel
- DISCORD_WEBHOOK_TASKS → #tasks channel
- DISCORD_WEBHOOK_STORIES → #stories channel

Discord message format:
🐛 [HIGH] New Bug #BUG-123
**Summary:** Dashboard not loading
**Reporter:** john@company.com
**Created:** 2 minutes ago
[View in Relay](link) | [View in Jira](link)

Type-specific emojis:

- Bug: 🐛
- Task: 📋
- Story: 📖

Triggers:

- Issue created → Post to respective channel
- Status changed to "Done" → Post update with ✅

Backend routes:
POST /api/notifications/test - Test email/Discord (admin only)

Settings page (frontend):

- Toggle email notifications on/off
- Toggle Discord mentions on/off
- Save to user_preferences table
- Relay branding

DELIVERABLES:

- Email service with SendGrid
- Discord webhook service
- HTML email templates with Relay branding
- Notification preferences UI
- Test endpoint

```

---

### MISSION 8: Dashboard + Stats (3-4h review time)

```

Create overview dashboard for Relay with key metrics.

BACKEND:
GET /api/stats endpoint returns:
{
total: number,
open: number,
in_progress: number,
done: number,
by_type: { Bug: number, Task: number, Story: number },
by_priority: { Highest: number, High: number, Medium: number, Low: number, Lowest: number },
my_issues: { total: number, open: number },
recent_activity: [...] // Last 10 updates
}

FRONTEND DASHBOARD:

Layout (grid):
┌─────────────────────────────────────┐
│ Welcome back, {User Name}! │
│ {Role Badge} │
├─────────┬─────────┬─────────────────┤
│ Total │ Open │ In Progress │
│ {count} │ {count} │ {count} │
├─────────┴─────────┴─────────────────┤
│ Issues by Type (Donut Chart) │
│ 🐛 Bugs: {count} │
│ 📋 Tasks: {count} │
│ 📖 Stories: {count} │
├─────────────────────────────────────┤
│ Issues by Priority (Bar Chart) │
│ ████████ Highest ({count}) │
│ ██████ High ({count}) │
│ ████ Medium ({count}) │
│ ██ Low ({count}) │
├─────────────────────────────────────┤
│ My Assigned Issues │
│ {list of 5 most recent} │
│ [View All] │
├─────────────────────────────────────┤
│ Recent Activity │
│ {timeline of last 10 updates} │
└─────────────────────────────────────┘

Charts:

- Use Recharts or Chart.js
- Responsive
- Animated on load
- Relay colors (orange/red gradients)
- Dark mode support

Stats cards:

- Glassmorphism
- Large numbers
- Trend indicators (if available)
- Click to filter issues

Recent activity:

- Mini timeline
- Icons for event types
- Relative timestamps
- "View all" link to activity page

BRANDING:

- Relay colors throughout
- Orange/red accents
- Modern, clean design

DELIVERABLES:

- Dashboard page
- Stats API endpoint
- Charts components
- Responsive grid layout

```

---

### MISSION 9: Polling System (3-4h review time)

```

Implement 60-second polling for real-time-ish updates in Relay.

FRONTEND POLLING HOOK:

useJiraPolling(intervalMs = 60000):

- Fetches /api/issues/updates every 60 seconds
- Compares with local state
- If changes detected:
  - Update local state
  - Show toast: "Issue BUG-123 updated"
  - Highlight changed rows briefly (orange glow)
- Pause polling when tab not active (visibility API)
- Resume when tab becomes active

BACKEND:
GET /api/issues/updates?since={timestamp}

- Returns issues updated since timestamp
- Include: key, summary, status, priority, updated_at
- Use Jira JQL: updated >= "{timestamp}"

VISUAL INDICATORS:

- "Live" badge in navbar (green dot + "Live")
- Toast notifications for updates (Relay branded)
- Row highlight animation (orange fade → transparent)
- "Updated 5 seconds ago" timestamp

OPTIMIZATION:

- Only poll if user is authenticated
- Don't poll on login/create pages
- Clear interval on component unmount
- Debounce rapid updates

ERROR HANDLING:

- If polling fails 3 times → show warning
- "Connection lost" banner
- Retry with exponential backoff
- Resume normal polling when recovered

DELIVERABLES:

- Polling hook
- Updates endpoint
- Visual indicators with Relay branding
- Error handling
- Performance optimization

```

---

### MISSION 10: Deployment + Polish (4-5h review time)

```

Production-ready deployment of Relay to Vercel.

PRODUCTION CHECKLIST:

Backend:

- Environment variables in Vercel
- Error logging (console + optional Sentry)
- Rate limiting (Flask-Limiter)
- Security headers (CORS, CSP)
- Health check endpoint
- API documentation (OpenAPI/Swagger)

Frontend:

- Error boundaries
- 404 page
- Loading states everywhere
- Optimistic UI updates
- Keyboard shortcuts (Cmd+K for search)
- Meta tags (title: "Relay - Bug & Task Tracker", description)
- Favicon (Relay branding)

Vercel Configuration:

- Create vercel.json:
  {
  "version": 2,
  "builds": [
  { "src": "api/index.py", "use": "@vercel/python" },
  { "src": "package.json", "use": "@vercel/static-build" }
  ],
  "routes": [
  { "src": "/api/(.*)", "dest": "/api/index.py" },
  { "src": "/(.*)", "dest": "/index.html" }
  ]
  }

- Set environment variables in Vercel dashboard
- Configure Vercel URL: relay-tracker.vercel.app
- Enable SSL/HTTPS (automatic)

Testing:

- Test all features in production
- Test on mobile devices
- Test email notifications (SendGrid)
- Test Discord webhooks (all 3 channels)
- Load test (simulate 80 users)
- Test Google SSO in production

Documentation:

- README.md with:
  - Relay project overview
  - Setup instructions
  - Environment variables
  - Deployment steps
  - User guide
  - Admin guide (managing roles)
  - Jira Cloud setup guide

DELIVERABLES:

- Deployed to Vercel (relay-tracker.vercel.app)
- All environment variables set
- SSL working
- Documentation complete
- Production tested with 80 users

```

---

### MISSION 11: Email Whitelist Authentication + README Updates (5-6h review time)

```

Implement private access control via email whitelist and update all documentation.

PROBLEM:

- Currently anyone with a Google account can sign in
- Need private access for internal team only
- README files have outdated tech stack information (Supabase → Turso/Google OAuth)
- Missing comprehensive setup documentation

SOLUTION:
Implement email whitelist authentication (Option B) + update all README files.

---

PART 1: DATABASE SCHEMA

Create new table for email whitelist:

CREATE TABLE IF NOT EXISTS allowed_emails (
id INTEGER PRIMARY KEY AUTOINCREMENT,
email TEXT NOT NULL UNIQUE,
added_by TEXT,
notes TEXT,
created_at TEXT DEFAULT (datetime('now')),
FOREIGN KEY (added_by) REFERENCES user_roles(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_allowed_emails_email ON allowed_emails(email);

Migration Script (backend/migrate_whitelist.py):

- Check if table exists
- Create table if missing
- Automatically whitelist all existing users from user_roles
- Print summary of whitelisted emails
- Safe to run multiple times (idempotent)

---

PART 2: BACKEND - DATABASE UTILITIES

Update backend/api/utils/database.py:

Add new functions (append to end of file):

1. is_email_whitelisted(email: str) -> bool

   - Check if email exists in allowed_emails table
   - Case-insensitive comparison
   - Return True/False

2. get_all_whitelisted_emails() -> list

   - Get all whitelisted emails with metadata
   - Order by created_at DESC
   - Return list of dicts with: id, email, added_by, notes, created_at

3. add_email_to_whitelist(email: str, added_by: str, notes: str = None) -> dict

   - Add email to whitelist
   - Check if already exists (raise ValueError if duplicate)
   - Store email in lowercase
   - Return added email record

4. remove_email_from_whitelist(email: str) -> bool
   - Remove email from whitelist
   - Check if exists (raise ValueError if not found)
   - Return True on success

Modify create_user() function:

- Add whitelist check at the beginning
- If email not whitelisted, raise ValueError with message:
  "Email {email} is not authorized to access this application. Please contact an administrator."
- Continue with existing user creation logic if whitelisted

---

PART 3: BACKEND - API ROUTES

Create new file: backend/api/routes/whitelist.py

Admin-only endpoints for managing email whitelist:

GET /api/whitelist

- List all whitelisted emails
- Requires: @require_auth, @require_role("admin")
- Returns: { emails: [...], total: number }

POST /api/whitelist

- Add email to whitelist
- Requires: @require_auth, @require_role("admin")
- Body: { email: string, notes?: string }
- Validates email format (must contain @ and .)
- Returns: { success: true, email: {...} }
- Logs activity

DELETE /api/whitelist/{id}

- Remove email from whitelist
- Requires: @require_auth, @require_role("admin")
- Prevents removing your own email
- Returns: { success: true, message: string }
- Logs activity

GET /api/whitelist/check/{email}

- Check if email is whitelisted
- Requires: @require_auth, @require_role("admin")
- Returns: { email: string, whitelisted: boolean }

Update backend/api/index.py:

- Import whitelist_bp
- Register blueprint: app.register_blueprint(whitelist_bp)
- Add to root endpoint documentation

---

PART 4: FRONTEND - WHITELIST MANAGEMENT UI

Create new file: frontend/src/pages/WhitelistManagement.tsx

Admin page for managing whitelisted emails:

LAYOUT:

- Header with icon + title "Email Whitelist"
- Description: "Manage who can access Relay"
- Search bar + "Add Email" button
- Table/list of whitelisted emails
- Info box: "Only whitelisted emails can sign in with Google OAuth"

TABLE COLUMNS:

- Email address
- Added by (user name/email)
- Notes
- Date added
- Actions (Remove button)

ADD EMAIL MODAL:

- Email input (required, validated)
- Notes textarea (optional)
- Cancel + Add buttons
- Validation:
  - Email format check
  - Duplicate check
  - Show error if already exists
- Success toast on add

REMOVE EMAIL CONFIRMATION:

- Confirm dialog before removing
- Show email being removed
- Prevent removing own email
- Success toast on remove

FEATURES:

- Search/filter emails
- Loading states
- Error handling
- Responsive design
- Glassmorphism style matching AdminSettings
- Orange/red accent colors

---

PART 5: FRONTEND - API CLIENT

Update frontend/src/lib/api.ts:

Add whitelist functions:

export async function fetchWhitelistedEmails(): Promise<WhitelistEmail[]>
export async function addEmailToWhitelist(email: string, notes?: string): Promise<WhitelistEmail>
export async function removeEmailFromWhitelist(emailId: number): Promise<void>
export async function checkEmailWhitelisted(email: string): Promise<boolean>

Update frontend/src/types/index.ts:

Add type:
export interface WhitelistEmail {
id: number;
email: string;
added_by: string | null;
notes: string | null;
created_at: string;
}

---

PART 6: FRONTEND - NAVIGATION

Update frontend/src/App.tsx:

- Import WhitelistManagementPage
- Add route: <Route path="/admin/whitelist" element={<WhitelistManagementPage />} />

Update frontend/src/components/Navbar.tsx:

- Add "Email Whitelist" link in admin dropdown
- Only show if hasRole("admin")
- Link to /admin/whitelist

---

PART 7: DOCUMENTATION UPDATES

Create NEW file: README.md (root of project)

Content:

- Project overview with tagline
- Features list (modern UI, private access, Jira sync, roles, notifications)
- Tech stack (React 19, Flask, Turso, Direct Google OAuth)
- Access control explanation (email whitelist)
- User roles table
- Project structure
- Getting started (prerequisites, setup steps)
- Environment variables (complete tables for backend + frontend)
- First-time setup: How to add first admin email via Turso CLI
- Deployment instructions (Vercel)
- API endpoints list
- Branding info
- Security notes
- License

Update frontend/README.md:

Replace entire file with Relay-specific content:

- Tech stack
- Project structure (src/ breakdown)
- Development setup
- Available scripts (dev, build, preview, lint)
- Environment variables
- Features (auth, issue management, admin, UI/UX)
- Code style
- Deployment
- Links to other docs

Create NEW file: backend/README.md

Content:

- Tech stack (Flask, Turso, Jira API, Google OAuth)
- Project structure (api/ breakdown)
- Development setup
- Environment variables with descriptions
- How to get API credentials (Jira, Google, Turso)
- Database schema explanation
- API endpoints list
- Authentication flow diagram
- Jira integration explanation
- Deployment
- Development tips (testing, migrations, debugging)

Update Docs/README.md:

Fix outdated references:

- Line 13: "Supabase Auth" → "Direct Google OAuth 2.0"
- Line 25: "Supabase Auth" → "Direct Google OAuth 2.0"
- Line 30: "Supabase PostgreSQL" → "Turso (libsql)"
- Lines 89-91: Replace Supabase env vars with Google OAuth + Turso
- Lines 143-157: Update environment variables table (remove Supabase, add Turso + Google OAuth)

---

PART 8: FIRST-TIME SETUP INSTRUCTIONS

Add to all README files:

IMPORTANT: First-Time Deployment
Before anyone can sign in, add the first admin email to the whitelist:

Using Turso CLI:
turso db shell your-database-name

In Turso shell:
INSERT INTO allowed_emails (email, notes)
VALUES ('your-email@example.com', 'First admin user');

The first user to sign in will automatically become admin.
After that, use the Admin > Email Whitelist page to add more users.

---

TESTING CHECKLIST:

Database:
✅ Run migrate_whitelist.py successfully
✅ Verify allowed_emails table created
✅ Existing users automatically whitelisted
✅ Can query whitelisted emails

Backend API:
✅ GET /api/whitelist returns all emails (admin only)
✅ POST /api/whitelist adds new email (admin only)
✅ DELETE /api/whitelist/{id} removes email (admin only)
✅ Cannot remove own email
✅ Non-admin users get 403 Forbidden
✅ Duplicate emails return error
✅ Invalid email format returns error

Authentication:
✅ Non-whitelisted email cannot sign in
✅ Error message is clear and helpful
✅ Whitelisted email can sign in
✅ New user created successfully
✅ Existing users still work

Frontend UI:
✅ Admin can access /admin/whitelist
✅ Non-admin gets access denied
✅ Can view all whitelisted emails
✅ Can add new email with notes
✅ Can remove email (not own)
✅ Search/filter works
✅ Loading states show
✅ Error messages display
✅ Success toasts appear
✅ Responsive on mobile

Documentation:
✅ Root README.md is accurate
✅ Frontend README.md is Relay-specific
✅ Backend README.md has setup instructions
✅ Docs/README.md has no Supabase references
✅ All environment variables documented
✅ First-time setup instructions clear
✅ Links between docs work

Deployment:
✅ Deploy to Vercel
✅ Add admin email to production Turso
✅ Test sign-in on production
✅ Verify whitelist management works
✅ Test adding/removing emails in production

---

DELIVERABLES:

Backend:

- migrate_whitelist.py (migration script)
- Updated database.py with whitelist functions
- New whitelist.py routes file
- Updated index.py with whitelist blueprint

Frontend:

- WhitelistManagement.tsx page
- Updated api.ts with whitelist functions
- Updated types/index.ts with WhitelistEmail type
- Updated App.tsx with route
- Updated Navbar.tsx with link

Documentation:

- README.md (root) - NEW
- frontend/README.md - UPDATED
- backend/README.md - NEW
- Docs/README.md - UPDATED

All files follow Relay branding (orange/red gradient, glassmorphism, modern design).

```

---

## 📋 MISSION SUMMARY

1. ✅ Project Foundation (3-4h)
2. ✅ Supabase + Google SSO (4-5h)
3. ✅ Jira API Integration (5-6h)
4. ✅ Issue List + Filters (5-6h)
5. ✅ Issue Detail View (4-5h)
6. ✅ Create Issue Form (4-5h)
7. ✅ Notifications (5-6h)
8. ✅ Dashboard (3-4h)
9. ✅ Polling System (3-4h)
10. ✅ Deployment (4-5h)
11. 🔄 Email Whitelist + README Updates (5-6h)

**Total: 45-60 hours of review/testing time**

---

## 🚀 HOW TO START

1. Copy MISSION 1 → Paste into Google Antigravity
2. Add your specific details (company name, Jira domain, etc.)
3. Let the agent work
4. Review artifacts when ready
5. Test locally
6. Provide feedback
7. Once approved → Move to MISSION 2
8. Repeat for all 11 missions

---

## 📝 SETUP REQUIREMENTS

Before starting, prepare:
1. ✅ Jira Cloud admin access
2. ✅ Jira API token
3. ✅ Jira project key
4. ✅ Turso account (free tier)
5. ✅ SendGrid account (free tier)
6. ✅ Discord webhooks (3 channels created)
7. ✅ Google Cloud Console (for OAuth)
8. ✅ Vercel account (free tier)

---

## 📖 ADDITIONAL NOTES

### Why This Architecture?
- **Pure passthrough (Option A)**: Simplest approach, no data sync issues
- **Turso for preferences only**: Keeps user settings and whitelist without complicating data flow
- **Polling vs Webhooks**: Polling is easier for MVP, webhooks can be added later
- **Flask serverless**: Matches your existing tech stack, easy to maintain
- **Email whitelist**: Private access control without complex user management

### Estimated Timeline
- **Week 1**: Missions 1-5 (Foundation + Core UI)
- **Week 2**: Missions 6-10 (Features + Deployment)
- **Week 3**: Mission 11 (Security + Documentation)
- **Total**: ~2-3 weeks with AI assistance

### Success Metrics
- ✅ 80 users can submit bugs/tasks
- ✅ All data syncs to Jira Cloud
- ✅ Notifications working (email + Discord)
- ✅ Users prefer it over JSM
- ✅ $0/month hosting cost

---

**END OF SPECIFICATION - Ready to build Relay! 🚀**
```
