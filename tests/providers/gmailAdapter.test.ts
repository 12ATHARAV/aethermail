import { describe, it, expect } from 'vitest';
import { GmailAdapter } from '../../providers/gmailAdapter';
import type { EmailAccount } from '../../types';

describe('GmailAdapter', () => {
  let gmailAdapter: GmailAdapter;
  let mockAccount: EmailAccount;

  beforeEach(() => {
    gmailAdapter = new GmailAdapter();
    mockAccount = {
      id: 'test-account',
      provider: 'gmail',
      email: 'test@gmail.com',
      name: 'Test User',
      accessToken: 'mock-token',
      settings: {
        syncFolders: ['INBOX'],
        defaultLabels: [],
        notifications: true,
        aiEnabled: true,
      },
    };
  });

  it('should have gmail provider type', () => {
    expect(gmailAdapter.provider).toBe('gmail');
  });

  it('should fetch emails without throwing', async () => {
    const emails = await gmailAdapter.fetchEmails(mockAccount);
    expect(Array.isArray(emails)).toBe(true);
  });

  it('should return emails with required properties', async () => {
    const emails = await gmailAdapter.fetchEmails(mockAccount, undefined, 5);
    expect(emails.length).toBeLessThanOrEqual(5);

    if (emails.length > 0) {
      const email = emails[0];
      expect(email).toHaveProperty('id');
      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('from');
      expect(email).toHaveProperty('date');
      expect(email).toHaveProperty('provider');
      expect(email.provider).toBe('gmail');
    }
  });

  it('should send email', async () => {
    const sentEmail = await gmailAdapter.sendEmail(mockAccount, {
      subject: 'Test Subject',
      to: [{ name: 'Recipient', email: 'recipient@example.com' }],
      body: 'Test body',
    });

    expect(sentEmail).toHaveProperty('id');
    expect(sentEmail.subject).toBe('Test Subject');
    expect(sentEmail.provider).toBe('gmail');
  });

  it('should get labels', async () => {
    const labels = await gmailAdapter.getLabels(mockAccount);
    expect(Array.isArray(labels)).toBe(true);
    expect(labels).toContain('inbox');
  });
});

describe('EmailAccount interface', () => {
  it('should accept valid account structure', () => {
    const account: EmailAccount = {
      id: '1',
      provider: 'outlook',
      email: 'user@outlook.com',
      name: 'User Name',
      accessToken: 'token',
      refreshToken: 'refresh',
      settings: {
        syncFolders: [],
        defaultLabels: [],
        notifications: false,
        aiEnabled: true,
      },
    };

    expect(account.provider).toBe('outlook');
    expect(account.settings.aiEnabled).toBe(true);
  });
});