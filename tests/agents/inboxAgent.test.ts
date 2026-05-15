import { describe, it, expect, beforeEach } from 'vitest';
import { InboxAgent } from '../../agents/inboxAgent';
import type { EmailAccount } from '../../types';

describe('InboxAgent', () => {
  let inboxAgent: InboxAgent;

  beforeEach(() => {
    inboxAgent = new InboxAgent();
  });

  it('should create an instance', () => {
    expect(inboxAgent).toBeDefined();
  });

  it('should register adapters', () => {
    const mockAdapter = {
      provider: 'gmail' as const,
      fetchEmails: vi.fn().mockResolvedValue([]),
    };

    inboxAgent.registerAdapter('gmail', mockAdapter as any);
    expect(inboxAgent).toBeDefined();
  });

  it('should return empty emails when no accounts provided', async () => {
    const result = await inboxAgent.run({ accounts: [] });
    expect(result.success).toBe(true);
    expect(result.data?.emails).toHaveLength(0);
  });

  it('should handle errors for unregistered providers', async () => {
    const accounts: EmailAccount[] = [
      {
        id: '1',
        provider: 'gmail',
        email: 'test@gmail.com',
        name: 'Test',
        accessToken: 'token',
        settings: { syncFolders: [], defaultLabels: [], notifications: true, aiEnabled: true },
      },
    ];

    const result = await inboxAgent.run({ accounts });
    expect(result.success).toBe(true);
    expect(result.data?.errors).toContain('No adapter registered for provider: gmail');
  });

  it('should get sync state', () => {
    const syncState = inboxAgent.getSyncState();
    expect(syncState).toHaveProperty('lastSync');
    expect(syncState).toHaveProperty('accountLastSync');
  });
});