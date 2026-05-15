# AetherMail - AI-First Universal Email Client PWA

## Project Overview

AetherMail is an AI-powered email client that aggregates emails from multiple providers (Gmail, Outlook, IMAP) into a unified inbox, uses Claude AI for summarization, reply drafting, and prioritization.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **PWA**: Vite PWA plugin with service worker (offline inbox caching)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Email Providers**: Gmail API, Microsoft Graph API, node-imap (IMAP)
- **Backend**: Node.js + Express (serverless-ready for Vercel)
- **Auth**: Custom OAuth flow with NextAuth.js patterns
- **State**: Zustand
- **Routing**: React Router v6

## Architecture - Agent OS Methodology

### Agents

1. **OrchestratorAgent** — Routes tasks, manages agent lifecycle
2. **InboxAgent** — Fetches/syncs emails from all providers into unified inbox
3. **SummarizerAgent** — Calls Claude API to summarize email threads
4. **DrafterAgent** — Calls Claude API to generate reply drafts
5. **PrioritizerAgent** — Calls Claude API to rank emails by urgency/importance
6. **SearchAgent** — Handles search, labels, archive/delete operations

## Project Structure

```
/src
  /agents/          # All agents as TypeScript classes
  /hooks/           # Custom React hooks (useEmail, useAI, useAuth)
  /components/      # UI components
  /providers/       # Email provider adapters
  /lib/             # Shared utilities
  /stores/          # Zustand stores
  /types/           # TypeScript type definitions
  /pages/           # React Router pages
  /api/             # Express API routes
/docs/              # Architecture docs
```

## Key Conventions

- All agents extend a base Agent class with common lifecycle methods
- Email adapters implement a unified EmailProvider interface
- Use Zustand for global state management
- Tailwind for styling (follow existing patterns in components)
- Claude API calls should include prompt caching where possible

## Environment Variables

Required in `.env`:
- `ANTHROPIC_API_KEY` — Claude API key
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Gmail OAuth
- `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` — Outlook OAuth
- `NEXTAUTH_SECRET` — Auth secret
- `DATABASE_URL` — For session storage (Vercel Postgres recommended)

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint

## Current Status

Initial scaffold created. See `/docs/` for architecture documentation.


## Testing

- Vitest for unit tests
- Playwright for E2E
- Run: npm test


## Deployment
- Platform: Vercel
- Build: npm run build
- Output: dist/
- Serverless functions in /api/