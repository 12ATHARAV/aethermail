export interface AgentConfig {
  name: string;
  enabled: boolean;
  maxRetries: number;
  timeout: number;
}

export interface AgentTask {
  id: string;
  type: TaskType;
  payload: unknown;
  priority: number;
  status: TaskStatus;
  result?: unknown;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export type TaskType =
  | 'sync_emails'
  | 'summarize_thread'
  | 'draft_reply'
  | 'prioritize_emails'
  | 'search_emails'
  | 'archive_email'
  | 'delete_email'
  | 'apply_label';

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
  system?: string;
  temperature?: number;
}