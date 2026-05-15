import Fuse from 'fuse.js';
import { BaseAgent } from './baseAgent';
import type { Email, AgentResult } from '@/types';
import type { EmailProviderAdapter } from '@/providers/gmailAdapter';

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
  limit?: number;
}

interface LabelInput {
  emailId: string;
  label: string;
  action: 'add' | 'remove' | 'create';
}

interface LabelResult {
  success: boolean;
  labels: string[];
}

interface SearchResult {
  results: Email[];
  suggestions?: string[];
  total: number;
}

/**
 * SearchAgent - Local search with Fuse.js, label management, archive/delete
 */
export class SearchAgent extends BaseAgent {
  private fuseInstance: Fuse<Email> | null = null;
  private availableLabels: Set<string> = new Set(['inbox', 'important', 'work', 'personal', 'travel']);
  private adapters: Map<string, EmailProviderAdapter> = new Map();

  /**
   * Initialize Fuse.js instance for fuzzy search
   */
  private initializeFuse(emails: Email[]): void {
    const options: Fuse.IFuseOptions<Email> = {
      keys: [
        { name: 'subject', weight: 0.4 },
        { name: 'body', weight: 0.3 },
        { name: 'snippet', weight: 0.2 },
        { name: 'from.name', weight: 0.05 },
        { name: 'from.email', weight: 0.05 },
      ],
      threshold: 0.3, // Lower = more strict matching
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
    };

    this.fuseInstance = new Fuse(emails, options);
    console.log(`[SearchAgent] Initialized Fuse.js with ${emails.length} emails`);
  }

  /**
   * Register email provider adapter for archive/delete operations
   */
  registerAdapter(provider: string, adapter: EmailProviderAdapter): void {
    this.adapters.set(provider, adapter);
  }

  /**
   * Main execute - handles search with Fuse.js
   */
  async execute(input: unknown): Promise<AgentResult<SearchResult>> {
    const { query, emails, filters = {}, limit = 50 } = input as SearchInput;

    // Initialize Fuse if not done or email list changed
    if (!this.fuseInstance || emails.length > 0) {
      this.initializeFuse(emails);
    }

    let results: Email[] = [...emails];

    // Apply filters first (non-Fuse filters)
    if (filters.from) {
      results = results.filter(e =>
        e.from.email.toLowerCase().includes(filters.from!.toLowerCase()) ||
        e.from.name.toLowerCase().includes(filters.from!.toLowerCase())
      );
    }

    if (filters.to) {
      results = results.filter(e =>
        e.to.some(a => a.email.toLowerCase().includes(filters.to!.toLowerCase()))
      );
    }

    if (filters.subject) {
      results = results.filter(e =>
        e.subject.toLowerCase().includes(filters.subject!.toLowerCase())
      );
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      results = results.filter(e => e.date >= start && e.date <= end);
    }

    if (filters.labels && filters.labels.length > 0) {
      results = results.filter(e =>
        filters.labels!.some(label => e.labels.includes(label))
      );
    }

    if (filters.hasAttachment) {
      results = results.filter(e => e.attachments.length > 0);
    }

    // Apply Fuse.js fuzzy search if query provided
    if (query && query.trim() && this.fuseInstance) {
      const searchTerms = query.trim().split(/\s+/);

      if (searchTerms.length === 1) {
        // Single term - use Fuse directly
        const fuseResults = this.fuseInstance.search(query);
        const fuseIds = new Set(fuseResults.map(r => r.item.id));
        results = results.filter(e => fuseIds.has(e.id));
      } else {
        // Multiple terms - search each and intersect
        const termResults = searchTerms.map(term => {
          const fuseResults = this.fuseInstance!.search(term);
          return new Set(fuseResults.map(r => r.item.id));
        });

        // Intersection of all term results
        const matchingIds = termResults.reduce((acc, set) => {
          return new Set([...acc].filter(x => set.has(x)));
        });

        results = results.filter(e => matchingIds.has(e.id));
      }
    }

    const total = results.length;
    results = results.slice(0, limit);

    const suggestions = this.generateSuggestions(query, emails);

    console.log(`[SearchAgent] Search "${query}": ${total} results`);

    return {
      success: true,
      data: {
        results,
        suggestions,
        total,
      },
      metadata: {
        originalCount: emails.length,
        filteredCount: total,
        query,
      },
    };
  }

  /**
   * Handle label management operations
   */
  async handleLabel(input: LabelInput, email: Email): Promise<AgentResult<LabelResult>> {
    const { action, label } = input;

    switch (action) {
      case 'add':
        if (!email.labels.includes(label)) {
          email.labels.push(label);
        }
        this.availableLabels.add(label);
        break;

      case 'remove':
        email.labels = email.labels.filter(l => l !== label);
        break;

      case 'create':
        this.availableLabels.add(label);
        if (!email.labels.includes(label)) {
          email.labels.push(label);
        }
        break;
    }

    return {
      success: true,
      data: {
        success: true,
        labels: email.labels,
      },
      metadata: { emailId: input.emailId, action, label },
    };
  }

  /**
   * Handle archive operation - calls provider adapter
   */
  async archiveEmail(email: Email): Promise<AgentResult<{ archived: boolean; emailId: string }>> {
    const adapter = this.adapters.get(email.provider);

    if (adapter) {
      try {
        await adapter.archiveEmail({} as any, email.id);
        console.log(`[SearchAgent] Archived ${email.id} via ${email.provider} adapter`);
      } catch (error) {
        console.warn(`[SearchAgent] Adapter archive failed, doing local only`);
      }
    }

    return {
      success: true,
      data: { archived: true, emailId: email.id },
    };
  }

  /**
   * Handle delete operation - calls provider adapter
   */
  async deleteEmail(email: Email): Promise<AgentResult<{ deleted: boolean; emailId: string }>> {
    const adapter = this.adapters.get(email.provider);

    if (adapter) {
      try {
        await adapter.deleteEmail({} as any, email.id);
        console.log(`[SearchAgent] Deleted ${email.id} via ${email.provider} adapter`);
      } catch (error) {
        console.warn(`[SearchAgent] Adapter delete failed, doing local only`);
      }
    }

    return {
      success: true,
      data: { deleted: true, emailId: email.id },
    };
  }

  /**
   * Get all available labels
   */
  getAvailableLabels(): string[] {
    return Array.from(this.availableLabels);
  }

  /**
   * Create a new label
   */
  createLabel(label: string): boolean {
    if (this.availableLabels.has(label)) {
      return false; // Already exists
    }
    this.availableLabels.add(label);
    console.log(`[SearchAgent] Created new label: ${label}`);
    return true;
  }

  /**
   * Delete a label (removes from all emails)
   */
  deleteLabel(label: string, emails: Email[]): number {
    if (!this.availableLabels.has(label)) {
      return 0;
    }

    let count = 0;
    emails.forEach(email => {
      const originalLength = email.labels.length;
      email.labels = email.labels.filter(l => l !== label);
      if (email.labels.length !== originalLength) {
        count++;
      }
    });

    this.availableLabels.delete(label);
    console.log(`[SearchAgent] Deleted label: ${label} from ${count} emails`);
    return count;
  }

  /**
   * Generate search suggestions based on email content
   */
  private generateSuggestions(query: string, emails: Email[]): string[] {
    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();

    // Get most common labels
    const labelCounts: Record<string, number> = {};
    emails.forEach(e => e.labels.forEach(l => {
      labelCounts[l] = (labelCounts[l] || 0) + 1;
    }));

    Object.entries(labelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([label]) => {
        if (!queryLower.includes(label.toLowerCase())) {
          suggestions.push(`label:${label}`);
        }
      });

    // Add sender domain suggestions
    const senderDomains = new Set<string>();
    emails.forEach(e => {
      const domain = e.from.email.split('@')[1];
      if (domain) senderDomains.add(domain);
    });

    Array.from(senderDomains).slice(0, 2).forEach(domain => {
      if (!queryLower.includes(domain)) {
        suggestions.push(`from:@${domain}`);
      }
    });

    return suggestions.slice(0, 5);
  }
}

export default SearchAgent;