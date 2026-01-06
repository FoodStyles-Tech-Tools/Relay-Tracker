# Relay

**Fast track from report to resolution**

Relay is a modern bug and task tracking web application that integrates with Jira Cloud. It provides a beautiful, customizable interface for users to report issues while keeping all data synchronized with your Jira project.

## Features

- Modern React 19 frontend with Tailwind CSS
- Dark/Light mode support
- Python Flask serverless backend
- Bidirectional sync with Jira Cloud
- Google SSO authentication (via Supabase)
- Email notifications (SendGrid)
- Discord notifications
- Role-based access control (User, SQA, Admin)

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Lucide React (icons)
- Supabase Auth (Google SSO)

### Backend
- Python Flask (serverless on Vercel)
- Jira Cloud REST API v3
- Supabase PostgreSQL

### Hosting
- Vercel (frontend + backend serverless)

## Project Structure

```
relay-tracker/
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and API client
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # Flask backend
│   ├── api/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Utility functions
│   │   ├── models/          # Data models
│   │   └── index.py         # Flask app entry point
│   └── requirements.txt
├── vercel.json              # Vercel deployment config
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- Python 3.9 or higher
- npm or yarn

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_API_URL=http://localhost:5000
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

5. Update the `.env` file with your configuration (see Environment Variables section)

6. Start the development server:
   ```bash
   python api/index.py
   ```

   The backend will be available at `http://localhost:5000`

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `JIRA_URL` | Your Jira Cloud URL (e.g., https://yourcompany.atlassian.net) |
| `JIRA_EMAIL` | Email associated with Jira API token |
| `JIRA_API_TOKEN` | Jira API token |
| `JIRA_PROJECT_KEY` | Jira project key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |
| `SENDGRID_API_KEY` | SendGrid API key for emails |
| `DISCORD_WEBHOOK_BUGS` | Discord webhook URL for bugs channel |
| `DISCORD_WEBHOOK_TASKS` | Discord webhook URL for tasks channel |
| `DISCORD_WEBHOOK_STORIES` | Discord webhook URL for stories channel |
| `FRONTEND_URL` | Frontend URL for CORS |

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_API_URL` | Backend API URL |

## Deployment

### Vercel Deployment

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Import the project in Vercel

3. Configure environment variables in the Vercel dashboard

4. Deploy!

The application will be available at `https://relay-tracker.vercel.app` (or your custom domain)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |

*More endpoints will be added in future missions*

## Branding

- **Colors**: Orange/Red gradient (#FF6B35 → #F7931E)
- **Style**: Modern, glassmorphism, clean
- **Logo**: Signal waves icon

## License

Private - Internal use only
