import { describe, it, expect } from 'vitest';
import { SummarizerAgent } from '../../agents/summarizerAgent';
import type { Email } from '../../types';

describe('SummarizerAgent', () => {
  let summarizerAgent: SummarizerAgent;

  beforeEach(() => {
    summarizerAgent = new SummarizerAgent();
  });

  it('should create an instance', () => {
    expect(summarizerAgent).toBeDefined();
  });

  it('should return empty summary for empty emails', async () => {
    const result = await summarizerAgent.run({ emails: [] });
    expect(result.success).toBe(true);
    expect(result.data?.summary).toBe('No emails to summarize.');
    expect(result.data?.actionRequired).toBe(false);
    expect(result.data?.urgency).toBe('low');
  });

  it('should validate email input structure', () => {
    const mockEmail: Email = {
      id: '1',
      threadId: 'thread-1',
      subject: 'Test Subject',
      from: { name: 'Test User', email: 'test@example.com' },
      to: [{ name: 'Me', email: 'me@example.com' }],
      date: new Date(),
      snippet: 'Test snippet',
      body: 'Test body content',
      labels: [],
      attachments: [],
      isRead: false,
      isStarred: false,
      provider: 'gmail',
      folder: 'INBOX',
    };

    expect(mockEmail.subject).toBe('Test Subject');
    expect(mockEmail.from.email).toBe('test@example.com');
  });
});