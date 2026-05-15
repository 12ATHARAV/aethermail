import type { Email, EmailAccount, EmailProvider } from '@/types';

interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

export class IMAPAdapter implements EmailProviderAdapter {
  provider: EmailProvider = 'imap';
  private config: IMAPConfig | null = null;

  configure(config: IMAPConfig): void {
    this.config = config;
  }

  async fetchEmails(account: EmailAccount, since?: Date, limit = 50): Promise<Email[]> {
    console.log('Fetching IMAP emails for:', account.email);
    console.log('Since:', since);
    console.log('Limit:', limit);

    return this.mockEmails(account, limit);
  }

  private mockEmails(account: EmailAccount, limit: number): Email[] {
    const mockEmails: Email[] = [];
    const senders = [
      { name: 'Admin', email: 'admin@server.com' },
      { name: 'System', email: 'system@server.com' },
      { name: 'Support', email: 'support@company.com' },
      { name: 'Notifications', email: 'notify@service.io' },
    ];

    for (let i = 0; i < limit; i++) {
      const sender = senders[i % senders.length];
      mockEmails.push({
        id: `imap-${account.id}-${i}`,
        threadId: `thread-${i}`,
        subject: `IMAP Email ${i + 1}: Server notification`,
        from: sender,
        to: [{ name: account.name, email: account.email }],
        date: new Date(Date.now() - i * 10800000),
        snippet: `This is an IMAP sample email snippet for message ${i + 1}...`,
        body: `This is the body of IMAP email ${i + 1}. It contains server and system notifications.`,
        labels: ['inbox'],
        attachments: [],
        isRead: i % 2 === 0,
        isStarred: false,
        provider: 'imap',
        folder: 'INBOX',
      });
    }

    return mockEmails;
  }

  async sendEmail(account: EmailAccount, email: Partial<Email>): Promise<Email> {
    console.log('Sending email via IMAP from account:', account.email);
    return {
      id: `imap-sent-${Date.now()}`,
      threadId: `thread-${Date.now()}`,
      subject: email.subject || '',
      from: { name: account.name, email: account.email },
      to: email.to || [],
      date: new Date(),
      snippet: email.body?.substring(0, 100) || '',
      body: email.body || '',
      labels: ['sent'],
      attachments: [],
      isRead: true,
      isStarred: false,
      provider: 'imap',
      folder: 'Sent',
    };
  }

  async markAsRead(_account: EmailAccount, _emailId: string): Promise<void> {
    console.log('Marking IMAP email as read:', _emailId);
  }

  async markAsUnread(_account: EmailAccount, _emailId: string): Promise<void> {
    console.log('Marking IMAP email as unread:', _emailId);
  }

  async archiveEmail(_account: EmailAccount, _emailId: string): Promise<void> {
    console.log('Archiving IMAP email:', _emailId);
  }

  async deleteEmail(_account: EmailAccount, _emailId: string): Promise<void> {
    console.log('Deleting IMAP email:', _emailId);
  }

  async applyLabel(_account: EmailAccount, _emailId: string, _label: string): Promise<void> {
    console.log('Applying label to IMAP email:', _label, _emailId);
  }

  async removeLabel(_account: EmailAccount, _emailId: string, _label: string): Promise<void> {
    console.log('Removing label from IMAP email:', _label, _emailId);
  }

  async getLabels(_account: EmailAccount): Promise<string[]> {
    return ['INBOX', 'Sent', 'Drafts', 'Trash', 'Archive', 'Junk'];
  }
}

export default IMAPAdapter;