import type { Email, EmailAccount, EmailProvider } from '@/types';

export interface EmailProviderAdapter {
  provider: EmailProvider;
  fetchEmails(account: EmailAccount, since?: Date, limit?: number): Promise<Email[]>;
  sendEmail(account: EmailAccount, email: Partial<Email>): Promise<Email>;
  markAsRead(account: EmailAccount, emailId: string): Promise<void>;
  markAsUnread(account: EmailAccount, emailId: string): Promise<void>;
  archiveEmail(account: EmailAccount, emailId: string): Promise<void>;
  deleteEmail(account: EmailAccount, emailId: string): Promise<void>;
  applyLabel(account: EmailAccount, emailId: string, label: string): Promise<void>;
  removeLabel(account: EmailAccount, emailId: string, label: string): Promise<void>;
  getLabels(account: EmailAccount): Promise<string[]>;
}

export class GmailAdapter implements EmailProviderAdapter {
  provider: EmailProvider = 'gmail';

  async fetchEmails(account: EmailAccount, since?: Date, limit = 50): Promise<Email[]> {
    console.log('Fetching Gmail emails for:', account.email);
    console.log('Access token:', account.accessToken.substring(0, 20) + '...');
    console.log('Since:', since);
    console.log('Limit:', limit);

    return this.mockEmails(account, limit);
  }

  private mockEmails(account: EmailAccount, limit: number): Email[] {
    const mockEmails: Email[] = [];
    const senders = [
      { name: 'John Smith', email: 'john.smith@example.com' },
      { name: 'Sarah Johnson', email: 'sarah.j@company.com' },
      { name: 'Mike Wilson', email: 'mike.w@startup.io' },
      { name: 'Emily Brown', email: 'emily.brown@design.co' },
    ];

    for (let i = 0; i < limit; i++) {
      const sender = senders[i % senders.length];
      mockEmails.push({
        id: `gmail-${account.id}-${i}`,
        threadId: `thread-${i}`,
        subject: `Email ${i + 1}: Important update`,
        from: sender,
        to: [{ name: account.name, email: account.email }],
        date: new Date(Date.now() - i * 3600000),
        snippet: `This is a sample email snippet for message ${i + 1}...`,
        body: `This is the body of email ${i + 1}. It contains important information that needs to be read.`,
        labels: i % 3 === 0 ? ['important', 'unread'] : ['inbox'],
        attachments: [],
        isRead: i % 3 !== 0,
        isStarred: i % 5 === 0,
        provider: 'gmail',
        folder: 'INBOX',
      });
    }

    return mockEmails;
  }

  async sendEmail(account: EmailAccount, email: Partial<Email>): Promise<Email> {
    console.log('Sending email from Gmail account:', account.email);
    return {
      id: `gmail-sent-${Date.now()}`,
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
      provider: 'gmail',
      folder: 'SENT',
    };
  }

  async markAsRead(_account: EmailAccount, _emailId: string): Promise<void> {
    console.log('Marking email as read:', _emailId);
  }

  async markAsUnread(_account: EmailAccount, _emailId: string): Promise<void> {
    console.log('Marking email as unread:', _emailId);
  }

  async archiveEmail(_account: EmailAccount, _emailId: string): Promise<void> {
    console.log('Archiving email:', _emailId);
  }

  async deleteEmail(_account: EmailAccount, _emailId: string): Promise<void> {
    console.log('Deleting email:', _emailId);
  }

  async applyLabel(_account: EmailAccount, _emailId: string, _label: string): Promise<void> {
    console.log('Applying label:', _label, 'to email:', _emailId);
  }

  async removeLabel(_account: EmailAccount, _emailId: string, _label: string): Promise<void> {
    console.log('Removing label:', _label, 'from email:', _emailId);
  }

  async getLabels(_account: EmailAccount): Promise<string[]> {
    return ['inbox', 'sent', 'drafts', 'trash', 'important', 'starred', 'work', 'personal'];
  }
}

export default GmailAdapter;