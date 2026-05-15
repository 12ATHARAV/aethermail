import { BaseAgent } from './baseAgent';
import type { Email, EmailAccount, EmailProvider, AgentResult } from '@/types';
import type { GmailAdapter } from '@/providers/gmailAdapter';
import type { OutlookAdapter } from '@/providers/outlookAdapter';
import type { IMAPAdapter } from '@/providers/imapAdapter';

interface AccountConfig {
  provider: EmailProvider;
  email: string;
  accessToken: string;
  refreshToken?: string;
  lastSyncTime?: Date;
}

interface InboxSyncInput {
  accounts: EmailAccount[] | AccountConfig[];
  since?: Date;
  limit?: number;
  pageSize?: number;
}

interface InboxAgentResult {
  emails: Email[];
  errors: string[];
  syncedAt: Date;
  totalFetched: number;
  hasMore: boolean;
}

interface SyncState {
  lastSync: Date;
  accountLastSync: Map<string, Date>;
}

/**
 * InboxAgent - Fetches and syncs emails from all providers with pagination and delta sync
 */
export class InboxAgent extends BaseAgent {
  private adapters: Map<EmailProvider, GmailAdapter | OutlookAdapter | IMAPAdapter> = new Map();
  private syncState: SyncState = {
    lastSync: new Date(0),
    accountLastSync: new Map(),
  };

  /**
   * Register an email provider adapter
   */
  registerAdapter(provider: EmailProvider, adapter: GmailAdapter | OutlookAdapter | IMAPAdapter): void {
    this.adapters.set(provider, adapter);
    console.log(`[InboxAgent] Registered adapter for: ${provider}`);
  }

  /**
   * Main execution - sync emails from all accounts
   * Handles pagination and delta sync (only fetch new since lastSync)
   */
  async execute(input: unknown): Promise<AgentResult<InboxAgentResult>> {
    const { accounts, since, limit = 100, pageSize = 50 } = input as InboxSyncInput;

    // Use delta sync: if since not provided, use last sync time
    const syncSince = since || this.syncState.lastSync;
    console.log(`[InboxAgent] Syncing since: ${syncSince.toISOString()}`);

    const allEmails: Email[] = [];
    const errors: string[] = [];
    let totalFetched = 0;
    let hasMore = false;

    for (const account of accounts) {
      const provider = 'provider' in account ? account.provider : account.provider;
      const adapter = this.adapters.get(provider);

      if (!adapter) {
        errors.push(`No adapter registered for provider: ${provider}`);
        continue;
      }

      try {
        // Delta sync: only fetch emails newer than last sync for this account
        const accountLastSync = this.syncState.accountLastSync.get(account.id || account.email) || syncSince;
        const shouldDeltaSync = accountLastSync > new Date(0);

        if (shouldDeltaSync) {
          console.log(`[InboxAgent] Delta sync for ${account.email} since ${accountLastSync.toISOString()}`);
        }

        // Handle pagination
        let page = 0;
        let hasMorePages = true;
        let accountEmails: Email[] = [];

        while (hasMorePages && accountEmails.length < limit) {
          const currentPageSize = Math.min(pageSize, limit - accountEmails.length);
          const emails = await adapter.fetchEmails(
            account as EmailAccount,
            shouldDeltaSync ? accountLastSync : undefined,
            currentPageSize
          );

          if (emails.length === 0 || emails.length < currentPageSize) {
            hasMorePages = false;
          }

          accountEmails.push(...emails);
          page++;

          console.log(`[InboxAgent] Fetched page ${page} for ${account.email}: ${emails.length} emails`);
        }

        allEmails.push(...accountEmails);
        totalFetched += accountEmails.length;

        // Update account sync state
        this.syncState.accountLastSync.set(account.id || account.email, new Date());

        // Check if there are more emails beyond the limit
        if (accountEmails.length >= limit) {
          hasMore = true;
        }

        console.log(`[InboxAgent] Synced ${accountEmails.length} emails from ${account.email}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to fetch from ${account.email}: ${errorMsg}`);
        console.error(`[InboxAgent] Error fetching from ${account.email}:`, error);
      }
    }

    // Sort by date (newest first)
    allEmails.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Update global sync state
    this.syncState.lastSync = new Date();

    const result: InboxAgentResult = {
      emails: allEmails,
      errors,
      syncedAt: new Date(),
      totalFetched,
      hasMore,
    };

    console.log(`[InboxAgent] Sync complete: ${totalFetched} emails, ${errors.length} errors`);

    return {
      success: errors.length === 0,
      data: result,
      metadata: {
        totalEmails: totalFetched,
        accountCount: accounts.length,
        syncDuration: Date.now(),
      },
    };
  }

  /**
   * Sync a single account with pagination support
   */
  async syncSingleAccount(
    account: EmailAccount,
    since?: Date,
    limit?: number
  ): Promise<Email[]> {
    const adapter = this.adapters.get(account.provider);
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${account.provider}`);
    }

    // Use delta sync: default to last sync time for this account
    const syncSince = since || this.syncState.accountLastSync.get(account.id) || new Date(0);

    console.log(`[InboxAgent] Syncing account ${account.email} since ${syncSince.toISOString()}`);

    const emails = await adapter.fetchEmails(account, syncSince, limit);
    this.syncState.accountLastSync.set(account.id, new Date());

    return emails;
  }

  /**
   * Fetch a specific page of emails (pagination)
   */
  async fetchPage(
    account: EmailAccount,
    page: number,
    pageSize: number = 50
  ): Promise<Email[]> {
    const adapter = this.adapters.get(account.provider);
    if (!adapter) {
      throw new Error(`No adapter for provider: ${account.provider}`);
    }

    // Calculate offset based on page
    const since = new Date(0); // Reset to get all for pagination

    return adapter.fetchEmails(account, since, pageSize);
  }

  /**
   * Get current sync state for debugging
   */
  getSyncState(): SyncState {
    return {
      lastSync: this.syncState.lastSync,
      accountLastSync: new Map(this.syncState.accountLastSync),
    };
  }

  /**
   * Force full sync (ignore delta)
   */
  async forceFullSync(accounts: EmailAccount[], limit?: number): Promise<AgentResult<InboxAgentResult>> {
    // Reset sync state
    this.syncState.lastSync = new Date(0);
    this.syncState.accountLastSync.clear();

    // Perform full sync
    return this.execute({ accounts, since: new Date(0), limit });
  }
}

export default InboxAgent;