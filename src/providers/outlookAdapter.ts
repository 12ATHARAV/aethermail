import type { Email, EmailAccount, EmailProvider } from '@/types';

export class OutlookAdapter implements EmailProviderAdapter {
  provider: EmailProvider = 'outlook';

  async fetchEmails(account: EmailAccount, since?: Date, limit = 50): Promise<Email[]> {
    console.log('Fetching Outlook emails for:', account.email);
    console.log('Access token:', account.accessToken.substring(0, 20) + '...');
    console.log('Since:', since);
    console.log('Limit:', limit);

    return this.mockEmails(account, limit);
  }

  private mockEmails(account: EmailAccount, limit: number): Email[] {
    const mockEmails: Email[] = [];
    const senders = [
      { name: 'Alice Chen', email: 'alice.chen@microsoft.com' },
      { name: 'Bob Martinez', email: 'bob.m@outlook.com' },
      { name: 'Carol Davis', email: 'carol.d@office365.com' },
      { name: 'David Lee', email: 'david.lee@tech.co' },
    ];

    for (let i = 0; i < limit; i++) {
      const sender = senders[i % senders.length];
      mockEmails.push({
        id: `outlook-${account.id}-${i}`,
        threadId: `thread-${i}`,
        subject: `Outlook Email ${i + 1}: Meeting reminder`,
        from: sender,
        to: [{ name: account.name, email: account.email }],
        date: new Date(Date.now() - i * 7200000),
        snippet: `This is an Outlook sample email snippet for message ${i + 1}...`,
        body: `This is the body of Outlook email ${i + 1}. It contains meeting details and updates.`,
        labels: i % 4 === 0 ? ['meeting'] : ['inbox'],
        attachments: [],
        isRead: i % 4 !== 0,
        isStarred: false,
        provider: 'outlook',
        folder: 'Inbox',
      });
    }

    return mockEmails;
  }

  async sendEmail(account: EmailAccount, email: Partial<Email>): Promise<Email> {
    console.log('Sending email from Outlook account:', account.email);
    return {
      id: `outlook-sent-${Date.now()}`,
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
      provider: 'outlook',
      folder: 'Sent',
    };
  }

  async markAsRead(_account: EmailAccount, _emailId: string): Promise<void> {
    console.log('Marking Outlook email as read:', _emailId);
  }

  async markAsUnread(_account: EmailAccount, _emailId: string): Promise<void> {
    console.log('Marking Outlook email as unread:', _emailId);
  }

  async archiveEmail(_account: EmailAccount, _emailId: string): Promise<void> {
    console.log('Archiving Outlook email:', _emailId);
  }

  async deleteEmail(_account: EmailAccount, _emailId: string): Promise<void> {
    console.log('Deleting Outlook email:', _emailId);
  }

  async applyLabel(_account: EmailAccount, _emailId: string, _label: string): Promise<void> {
    console.log('Applying label to Outlook email:', _label, _emailId);
  }

  async removeLabel(_account: EmailAccount, _emailId: string, _label: string): Promise<void> {
    console.log('Removing label from Outlook email:', _label, _emailId);
  }

  async getLabels(_account: EmailAccount): Promise<string[]> {
    return ['Inbox', 'Sent', 'Drafts', 'Deleted', 'Archive', 'Focused', 'Other'];
  }
}

export default OutlookAdapter;