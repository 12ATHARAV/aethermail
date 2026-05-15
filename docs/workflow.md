# AetherMail Workflows

## 1. New Email Arrival & Processing

When a new email arrives (polling interval or push notification):

```
Incoming Email (from provider)
       │
       ▼
┌─────────────────────────────────────┐
│  InboxAgent.fetchEmails()           │
│  - Identify provider (G/Outlook/IMAP)│
│  - Fetch via appropriate adapter    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Normalize to Email type            │
│  - Map Gmail/Outlook/IMAP fields    │
│  - Standardize date format          │
│  - Extract attachments metadata     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Store in IndexedDB                 │
│  - Offline access                  │
│  - Preserve full content           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PrioritizerAgent.run()            │
│  - Analyze subject, snippet, sender │
│  - Claude API: priorityScore()     │
│  - Assign priority 1-5             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Update Zustand store               │
│  - Add to email list               │
│  - Update unread count            │
│  - Trigger UI re-render           │
└─────────────────────────────────────┘

User sees: New email in inbox, sorted by priority
```

**Polling Strategy**:
- Active tab: Every 60 seconds
- Background: Every 5 minutes (if permitted)
- Push notifications: Gmail/Outlook webhooks (future)

---

## 2. User Triggers AI Summary

```
User clicks "Summarize" button on email/thread
       │
       ▼
┌─────────────────────────────────────┐
│  Collect thread emails              │
│  - Group by threadId               │
│  - Order chronologically           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  SummarizerAgent.run({ emails })   │
│  - Prepare email content           │
│  - Build Claude prompt             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Claude API: summarizeEmails()     │
│  System: "You are an expert..."    │
│  User: "Summarize these emails..."│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Parse Claude response             │
│  - Extract summary                │
│  - Parse key points (bullet)      │
│  - Extract action items           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Update Zustand store              │
│  - Store aiSummary on email       │
│  - Cache for offline access       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  React re-renders                  │
│  - Show summary in EmailView      │
└─────────────────────────────────────┘

User sees: AI-generated summary with key points and action items
```

---

## 3. Reply Draft Generation

```
User clicks "Reply" button on email
       │
       ▼
┌─────────────────────────────────────┐
│  Open ComposeModal                  │
│  - Pre-fill "To" from sender       │
│  - Pre-fill subject (Re: ...)     │
└──────────────┬──────────────────────┘
               │
               ▼ (User clicks "✨ Generate")
┌─────────────────────────────────────┐
│  DrafterAgent.run({                │
│    originalEmail,                  │
│    tone: 'professional',           │
│    length: 'medium'               │
│  })                                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Claude API: draftReply()          │
│  System: "Draft email replies..." │
│  User: Original email + context   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Parse response                    │
│  - Generate draft text            │
│  - Generate subject line          │
│  - Generate alternatives         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Populate ComposeModal             │
│  - Fill body textarea             │
│  - User can edit freely           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  User clicks "Send"                │
│  - ProviderAdapter.sendEmail()    │
│  - Show success/error             │
└─────────────────────────────────────┘

User sees: Pre-filled draft ready for editing and sending
```

---

## 4. Email Prioritization

```
Initial sync or periodic re-prioritization
       │
       ▼
┌─────────────────────────────────────┐
│  Collect all inbox emails           │
│  - Exclude sent/trash/drafts      │
│  - Limit to recent 500            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PrioritizerAgent.run({ emails }) │
│  - Prepare email metadata         │
│  - Build priority prompt          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Claude API: prioritizeEmails()    │
│  System: "Rank emails 1-5..."     │
│  User: Email list with snippets   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Parse response                    │
│  - Extract priority scores        │
│  - Generate reasons              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Categorize emails                 │
│  - urgent (5)                    │
│  - important (4)                 │
│  - normal (3)                    │
│  - low (1-2)                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Update Zustand store              │
│  - Store priority on each email   │
│  - Sort inbox by priority        │
└─────────────────────────────────────┘

User sees: Inbox sorted by AI-determined priority
```

---

## 5. Multi-Account Switching Flow

```
User clicks account switcher (top-right)
       │
       ▼
┌─────────────────────────────────────┐
│  Show dropdown with accounts        │
│  - Display email + provider icon  │
│  - "Add Account" option           │
└──────────────┬──────────────────────┘
               │
               ▼ (User selects different account)
┌─────────────────────────────────────┐
│  setSelectedAccount(accountId)     │
│  - Update Zustand                 │
│  - Trigger filter on emails       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Filter emails by provider          │
│  - Show only selected account     │
│  - Or "All accounts" view        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  UI re-renders                     │
│  - Sidebar shows account          │
│  - Inbox shows filtered emails    │
│  - Headers show selected account  │
└─────────────────────────────────────┘

User sees: Inbox filtered to selected account
```

### Adding New Account

```
User clicks "Add Account"
       │
       ▼
┌─────────────────────────────────────┐
│  Show provider selection           │
│  - Gmail, Outlook, IMAP           │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
   [Gmail]        [Outlook]        [IMAP]
       │               │               │
       ▼               ▼               ▼
  OAuth flow      OAuth flow    Credentials form
       │               │               │
       └───────┬───────┴───────┬───────┘
               ▼
┌─────────────────────────────────────┐
│  Receive tokens                     │
│  - access_token                   │
│  - refresh_token                  │
│  - expires_at                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Save to Zustand + IndexedDB       │
│  - Add to accounts array         │
│  - Fetch initial emails           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  InboxAgent.syncSingleAccount()    │
│  - Fetch emails for new account   │
│  - Merge into unified inbox       │
└─────────────────────────────────────┘
```

---

## 6. Offline Sync Strategy

### Service Worker Setup

```
┌─────────────────────────────────────┐
│  Vite PWA Plugin                    │
│  - Generates sw.js                 │
│  - Registers Workbox               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Caching Strategies                 │
│  ┌────────────────────────────────┐ │
│  │ Static (fingerprint)           │ │
│  │ Cache-first                    │ │
│  │ JS, CSS, fonts                │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ API Responses (emails)        │ │
│  │ Network-first                 │ │
│  │ Fallback to IndexedDB         │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ Claude API                     │ │
│  │ Network-only                   │ │
│  │ (no offline AI)               │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Offline Flow

```
User opens app (OFFLINE)
       │
       ▼
┌─────────────────────────────────────┐
│  Service Worker intercepts         │
│  - Check cache for static assets  │
│  - Always available (cached)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Load from IndexedDB               │
│  - getEmails()                    │
│  - Display cached inbox           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Show "Offline" indicator          │
│  - Banner at top                 │
│  - Disable send button           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Queue outgoing actions            │
│  - archive, delete, label         │
│  - Store in IndexedDB queue       │
└──────────────┬──────────────────────┘
               │
               ▼ (User comes ONLINE)
┌─────────────────────────────────────┐
│  Background Sync                   │
│  - Process queued actions        │
│  - Execute in order               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Fetch fresh emails                │
│  - Incremental sync since offline │
│  - Update IndexedDB              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  UI updates                        │
│  - Remove offline banner         │
│  - Show new emails               │
└─────────────────────────────────────┘
```

### IndexedDB Schema

```
Store: emails
  - id (key)
  - data (full email)
  - timestamp (for sync)

Store: queue
  - id (key)
  - action: 'archive' | 'delete' | 'label'
  - emailId
  - params
  - timestamp

Store: accounts
  - id (key)
  - provider
  - email
  - tokens (encrypted)
```

---

## Error Recovery

| Scenario | Recovery |
|----------|----------|
| OAuth token expired | Auto-refresh, prompt re-auth if fails |
| API rate limit | Exponential backoff, show user message |
| Claude API fails | Show error, offer retry, fallback to manual |
| Offline + AI request | Queue for later, show "requires internet" |
| Sync conflict | Last-write-wins, log for debugging |