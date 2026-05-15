export interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  date: Date;
  snippet: string;
  body: string;
  htmlBody?: string;
  labels: string[];
  attachments: Attachment[];
  isRead: boolean;
  isStarred: boolean;
  provider: EmailProvider;
  folder: string;
  priority?: number;
  aiSummary?: string;
  aiDraft?: string;
}

export interface EmailAddress {
  name: string;
  email: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data?: string;
}

export type EmailProvider = 'gmail' | 'outlook' | 'imap';

export interface EmailAccount {
  id: string;
  provider: EmailProvider;
  email: string;
  name: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  settings: AccountSettings;
}

export interface AccountSettings {
  syncFolders: string[];
  defaultLabels: string[];
  notifications: boolean;
  aiEnabled: boolean;
}

export interface EmailFolder {
  id: string;
  name: string;
  provider: EmailProvider;
  unreadCount: number;
  totalCount: number;
}

export interface EmailThread {
  id: string;
  subject: string;
  emails: Email[];
  participants: EmailAddress[];
  lastUpdated: Date;
  aiSummary?: string;
  priority?: number;
}