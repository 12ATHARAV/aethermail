# AetherMail Agents, Skills, Hooks & Plugins

## Agent Directory

| Agent | File | Responsibility |
|-------|------|----------------|
| OrchestratorAgent | `src/agents/orchestratorAgent.ts` | Task routing, agent coordination |
| InboxAgent | `src/agents/inboxAgent.ts` | Email fetching and sync |
| SummarizerAgent | `src/agents/summarizerAgent.ts` | AI-powered thread summarization |
| DrafterAgent | `src/agents/drafterAgent.ts` | AI-powered reply drafting |
| PrioritizerAgent | `src/agents/prioritizerAgent.ts` | AI-powered urgency scoring |
| SearchAgent | `src/agents/searchAgent.ts` | Email search and filtering |

---

## 1. OrchestratorAgent

**File**: `src/agents/orchestratorAgent.ts`

**Responsibility**: Central task router that dispatches work to specialized agents and manages agent lifecycle.

**Input Types**:
```typescript
interface OrchestratorInput {
  task: AgentTask;
  context?: {
    emails?: Email[];
    accounts?: EmailAccount[];
  };
}

type TaskType =
  | 'sync_emails'
  | 'summarize_thread'
  | 'draft_reply'
  | 'prioritize_emails'
  | 'search_emails'
  | 'archive_email'
  | 'delete_email'
  | 'apply_label';
```

**Output Types**:
```typescript
interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}
```

**Key Methods**:
- `execute(input)`: Route task to appropriate agent
- `getInboxAgent()`: Access InboxAgent instance
- `getSummarizerAgent()`: Access SummarizerAgent instance
- `getDrafterAgent()`: Access DrafterAgent instance
- `getPrioritizerAgent()`: Access PrioritizerAgent instance
- `getSearchAgent()`: Access SearchAgent instance

**Claude Prompt**: None (orchestrator only routes, no AI calls)

---

## 2. InboxAgent

**File**: `src/agents/inboxAgent.ts`

**Responsibility**: Fetch and synchronize emails from all connected providers (Gmail, Outlook, IMAP) into a unified inbox.

**Input Types**:
```typescript
interface InboxSyncInput {
  accounts: EmailAccount[];
  since?: Date;
  limit?: number;
}
```

**Output Types**:
```typescript
interface InboxAgentResult {
  emails: Email[];
  errors: string[];
  syncedAt: Date;
}
```

**Key Methods**:
- `execute(input)`: Sync all accounts
- `registerAdapter(provider, adapter)`: Register email provider
- `syncSingleAccount(account, since, limit)`: Sync one account

**Claude Prompt**: None (data aggregation only)

**Skills**:
- `emailFetch`: Fetch emails from multiple providers
- `emailNormalize`: Convert provider-specific format to unified Email type
- `syncIncremental`: Only fetch new emails since last sync
- `attachMentFetch`: Fetch attachment metadata

---

## 3. SummarizerAgent

**File**: `src/agents/summarizerAgent.ts`

**Responsibility**: Use Claude API to generate concise summaries of email threads, extracting key points and action items.

**Input Types**:
```typescript
interface SummarizeInput {
  emails: Email[];
  options?: {
    maxLength?: number;  // default: 500
    format?: 'bullet' | 'paragraph';  // default: 'bullet'
  };
}
```

**Output Types**:
```typescript
interface SummarizerResult {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}
```

**Claude System Prompt**:
```
You are an expert email summarizer. Analyze the email thread and provide:
1. A concise summary (N words max)
2. Key points as bullet points
3. Action items if any
```

**Skills**:
- `emailSummarize`: Generate thread summary
- `keyPointExtract`: Extract main discussion points
- `actionItemExtract`: Identify required actions
- `threadAnalyze`: Understand conversation flow

---

## 4. DrafterAgent

**File**: `src/agents/drafterAgent.ts`

**Responsibility**: Use Claude API to generate intelligent reply drafts based on the original email context.

**Input Types**:
```typescript
interface DraftReplyInput {
  originalEmail: Email;
  context?: string;
  tone?: 'formal' | 'casual' | 'friendly' | 'professional';  // default: 'professional'
  length?: 'short' | 'medium' | 'long';  // default: 'medium'
}
```

**Output Types**:
```typescript
interface DraftResult {
  draft: string;
  subject?: string;
  alternatives?: string[];
}
```

**Claude System Prompt**:
```
You are an AI assistant that drafts email replies.
Generate a professional, concise reply that addresses the original email.
Consider the specified tone and length.
```

**Skills**:
- `replyDraft`: Generate reply text
- `subjectSuggest`: Suggest subject line
- `toneAdapt`: Match specified tone
- `alternatives`: Generate multiple draft options

---

## 5. PrioritizerAgent

**File**: `src/agents/prioritizerAgent.ts`

**Responsibility**: Use Claude API to analyze and rank emails by urgency and importance (1-5 scale).

**Input Types**:
```typescript
interface PrioritizeInput {
  emails: Email[];
  criteria?: {
    includeSenders?: string[];
    excludeSenders?: string[];
  };
}
```

**Output Types**:
```typescript
interface PriorityResult {
  prioritized: Array<{
    email: Email;
    priority: number;  // 1-5
    reason: string;
  }>;
  categories: {
    urgent: Email[];      // priority >= 5
    important: Email[];  // priority == 4
    normal: Email[];     // priority == 3
    low: Email[];        // priority <= 2
  };
}
```

**Claude System Prompt**:
```
You are an AI assistant that prioritizes emails.
Rank emails by urgency and importance on a scale of 1-5 (5 being highest priority).
Consider: time sensitivity, sender importance, action required, and topic urgency.
```

**Skills**:
- `priorityScore`: Assign urgency score (1-5)
- `categoryGroup`: Group into urgent/important/normal/low
- `reasonGenerate`: Provide priority justification

---

## 6. SearchAgent

**File**: `src/agents/searchAgent.ts`

**Responsibility**: Handle advanced email search with full-text search, filters, and suggestions.

**Input Types**:
```typescript
interface SearchInput {
  query: string;
  emails: Email[];
  filters?: {
    from?: string;
    to?: string;
    subject?: string;
    dateRange?: { start: Date; end: Date };
    labels?: string[];
    hasAttachment?: boolean;
  };
  limit?: number;  // default: 50
}
```

**Output Types**:
```typescript
interface SearchResult {
  results: Email[];
  suggestions?: string[];
  total: number;
}
```

**Claude Prompt**: None (local filtering)

**Skills**:
- `fullTextSearch`: Search subject, body, snippet
- `filterBySender`: Filter by from/to
- `filterByDate`: Filter by date range
- `filterByLabel`: Filter by labels
- `suggestions`: Generate search suggestions

---

## Hooks Reference

| Hook | File | Purpose |
|------|------|---------|
| **useEmail** | `src/hooks/useEmail.ts` | CRUD operations on emails, folder management |
| **useAI** | `src/hooks/useAI.ts` | AI operations (summarize, draft, prioritize) |
| **useAuth** | `src/hooks/useAuth.ts` | Authentication, user session management |
| **useAccounts** | `src/hooks/useEmail.ts` | Account connection, token management |
| **useSearch** | `src/hooks/useEmail.ts` | Search functionality (delegates to SearchAgent) |

### useEmail Hook

```typescript
const {
  emails,           // Filtered email list
  folders,          // Available folders
  accounts,        // Connected accounts
  selectedEmail,   // Currently viewed email
  isLoading,       // Loading state
  unreadCount,     // Unread email count
  selectedAccount, // Active account filter
  setSelectedEmail,
  setSelectedAccount,
  refreshEmails,   // fetchEmails()
  syncAll,         // syncEmails()
  markRead,        // markAsRead()
  markUnread,      // markAsUnread()
  archive,         // archiveEmail()
  remove,          // deleteEmail()
  label,           // applyLabel()
  search,          // searchEmails()
} = useEmail();
```

### useAI Hook

```typescript
const {
  isProcessing,   // AI operation in progress
  error,           // Error message
  summarizeThread, // SummarizerAgent wrapper
  draftReply,      // DrafterAgent wrapper
  prioritizeEmails,// PrioritizerAgent wrapper
  generateSubject, // Claude subject generation
} = useAI();
```

### useAuth Hook

```typescript
const {
  user,                 // Current user
  isAuthenticated,      // Login state
  isLoading,            // Loading state
  accounts,             // Connected email accounts
  login,                // Email/password login
  logout,               // Clear session
  addAccount,           // Add email account
  removeAccount,        // Remove account
  getAccessToken,       // Get token for account
} = useAuth();
```

---

## Plugins (Provider Adapters)

| Plugin | File | Provider | Auth Type |
|--------|------|----------|-----------|
| **GmailPlugin** | `src/providers/gmailAdapter.ts` | Gmail | OAuth2 |
| **OutlookPlugin** | `src/providers/outlookAdapter.ts` | Outlook/Office 365 | OAuth2 |
| **IMAPPlugin** | `src/providers/imapAdapter.ts` | Any IMAP server | Username/Password |

### EmailProviderAdapter Interface

All adapters implement:

```typescript
interface EmailProviderAdapter {
  provider: EmailProvider;  // 'gmail' | 'outlook' | 'imap'
  
  // Fetch
  fetchEmails(account, since?, limit?): Promise<Email[]>;
  
  // Send
  sendEmail(account, email): Promise<Email>;
  
  // Modify
  markAsRead(account, emailId): Promise<void>;
  markAsUnread(account, emailId): Promise<void>;
  archiveEmail(account, emailId): Promise<void>;
  deleteEmail(account, emailId): Promise<void>;
  applyLabel(account, emailId, label): Promise<void>;
  removeLabel(account, emailId, label): Promise<void>;
  
  // Meta
  getLabels(account): Promise<string[]>;
}
```

---

## Skill Summary

| Skill | Agent | Description |
|-------|-------|-------------|
| `emailSummarize` | SummarizerAgent | Generate thread summaries |
| `replyDraft` | DrafterAgent | Create AI reply drafts |
| `priorityScore` | PrioritizerAgent | Rank emails by urgency |
| `threadGroup` | InboxAgent | Group emails into threads |
| `labelSuggest` | SearchAgent | Suggest labels based on content |

---

## BaseAgent Class

All agents extend `BaseAgent` (`src/agents/baseAgent.ts`):

```typescript
abstract class BaseAgent {
  protected config: AgentConfig;
  
  // Lifecycle
  async run(input): Promise<AgentResult>;
  abstract execute(input): Promise<AgentResult>;
  
  // State
  enable() / disable(): void;
  isActive(): boolean;
  getConfig(): AgentConfig;
}
```