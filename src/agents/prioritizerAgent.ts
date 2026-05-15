import { BaseAgent } from './baseAgent';
import { claudeClient } from '@/lib';
import type { Email, AgentResult } from '@/types';
import { useEmailStore } from '@/stores/emailStore';

interface PrioritizeInput {
  emails: Email[];
  criteria?: {
    includeSenders?: string[];
    excludeSenders?: string[];
  };
}

interface PriorityResult {
  prioritized: Array<{
    email: Email;
    priority: number;  // 1-10
    reason: string;
  }>;
  sortedEmails: Email[];
  statistics: {
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    averageScore: number;
  };
}

/**
 * PrioritizerAgent - AI-powered email urgency scoring (1-10)
 * Caches scores in Zustand store
 */
export class PrioritizerAgent extends BaseAgent {
  private cache: Map<string, { score: number; timestamp: number }> = new Map();
  private cacheTTL: number = 30 * 60 * 1000; // 30 minutes

  async execute(input: unknown): Promise<AgentResult<PriorityResult>> {
    const { emails, criteria = {} } = input as PrioritizeInput;

    if (emails.length === 0) {
      return {
        success: true,
        data: {
          prioritized: [],
          sortedEmails: [],
          statistics: { highPriority: 0, mediumPriority: 0, lowPriority: 0, averageScore: 0 },
        },
      };
    }

    // Filter by criteria
    let filteredEmails = [...emails];

    if (criteria.excludeSenders?.length) {
      filteredEmails = filteredEmails.filter(
        e => !criteria.excludeSenders!.some(sender => e.from.email.includes(sender))
      );
    }

    if (criteria.includeSenders?.length) {
      filteredEmails = filteredEmails.filter(
        e => criteria.includeSenders!.some(sender => e.from.email.includes(sender))
      );
    }

    try {
      // Prepare email data for batch scoring
      const emailData = filteredEmails.map((e, i) => ({
        index: i,
        from: e.from.email,
        subject: e.subject,
        snippet: e.snippet.substring(0, 100),
        date: e.date.toISOString(),
        isRead: e.isRead,
      }));

      // Get cached scores for unchanged emails
      const uncachedEmails: typeof emailData = [];
      const cachedScores: Map<number, number> = new Map();

      emailData.forEach((email) => {
        const cacheKey = `${email.from}:${email.subject}`.substring(0, 100);
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
          cachedScores.set(email.index, cached.score);
        } else {
          uncachedEmails.push(email);
        }
      });

      // Score uncached emails via Claude API (batch)
      let newScores: number[] = [];
      if (uncachedEmails.length > 0) {
        newScores = await this.scoreEmailsBatch(uncachedEmails);

        // Cache the new scores
        uncachedEmails.forEach((email, i) => {
          const cacheKey = `${email.from}:${email.subject}`.substring(0, 100);
          this.cache.set(cacheKey, { score: newScores[i], timestamp: Date.now() });
        });
      }

      // Merge cached and new scores
      const allScores = emailData.map(e => {
        if (cachedScores.has(e.index)) {
          return cachedScores.get(e.index)!;
        }
        const uncachedIndex = uncachedEmails.findIndex(ue => ue.index === e.index);
        return uncachedIndex >= 0 ? newScores[uncachedIndex] : 5; // Default to middle
      });

      // Build prioritized results
      const prioritized = filteredEmails.map((email, index) => ({
        email,
        priority: allScores[index],
        reason: this.getPriorityReason(allScores[index]),
      }));

      // Sort by priority (highest first)
      prioritized.sort((a, b) => b.priority - a.priority);

      // Extract sorted emails
      const sortedEmails = prioritized.map(p => p.email);

      // Calculate statistics
      const highPriority = prioritized.filter(p => p.priority >= 8).length;
      const mediumPriority = prioritized.filter(p => p.priority >= 5 && p.priority < 8).length;
      const lowPriority = prioritized.filter(p => p.priority < 5).length;
      const averageScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

      // Cache scores in Zustand store
      this.cacheInZustand(prioritized);

      console.log(`[PrioritizerAgent] Prioritized ${filteredEmails.length} emails: high=${highPriority}, medium=${mediumPriority}, low=${lowPriority}`);

      return {
        success: true,
        data: {
          prioritized,
          sortedEmails,
          statistics: {
            highPriority,
            mediumPriority,
            lowPriority,
            averageScore: Math.round(averageScore * 10) / 10,
          },
        },
        metadata: {
          totalEmails: filteredEmails.length,
          cachedCount: cachedScores.size,
          scoredCount: uncachedEmails.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to prioritize emails',
      };
    }
  }

  /**
   * Score emails in batch via Claude API (1-10 scale)
   */
  private async scoreEmailsBatch(emails: Array<{ index: number; from: string; subject: string; snippet: string }>): Promise<number[]> {
    const systemPrompt = `You are an AI assistant that prioritizes emails.
Score each email 1-10 for urgency (10 = most urgent, 1 = least urgent).
Consider: time sensitivity, sender importance, action required, topic urgency, and whether the email is read.
Respond with only space-separated priority scores, one per email in order.`;

    const emailList = emails.map(e =>
      `${e.index + 1}. From: ${e.from}\n   Subject: ${e.subject}\n   Preview: ${e.snippet}`
    ).join('\n');

    const response = await claudeClient.claudeComplete(
      systemPrompt,
      `Score these emails for urgency (1-10):\n\n${emailList}`,
      512
    );

    // Parse scores
    const scores = response.match(/\d+/g)?.map(Number) || [];

    // Ensure we have a score for each email
    return emails.map((_, i) => {
      const score = scores[i];
      return (score >= 1 && score <= 10) ? score : 5; // Default to 5 if invalid
    });
  }

  /**
   * Generate human-readable reason for priority score
   */
  private getPriorityReason(score: number): string {
    if (score >= 9) return 'Critical - requires immediate attention';
    if (score >= 8) return 'High - important and time-sensitive';
    if (score >= 7) return 'High - important but not urgent';
    if (score >= 5) return 'Medium - standard priority';
    if (score >= 3) return 'Low - can wait';
    return 'Low - not urgent';
  }

  /**
   * Cache priority scores in Zustand store
   */
  private cacheInZustand(prioritized: Array<{ email: Email; priority: number }>): void {
    try {
      const emailStore = useEmailStore.getState();
      const priorityMap = new Map(prioritized.map(p => [p.email.id, p.priority]));

      // Update emails in store with priority scores
      const currentEmails = emailStore.emails;
      const updatedEmails = currentEmails.map(e => ({
        ...e,
        priority: priorityMap.get(e.id) ?? e.priority,
      }));

      emailStore.setEmails(updatedEmails);
      console.log('[PrioritizerAgent] Cached priorities in Zustand store');
    } catch (error) {
      console.warn('[PrioritizerAgent] Failed to cache in Zustand:', error);
    }
  }

  /**
   * Clear priority cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[PrioritizerAgent] Priority cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; oldestEntry: number } {
    let oldest = 0;
    this.cache.forEach((value) => {
      if (oldest === 0 || value.timestamp < oldest) {
        oldest = value.timestamp;
      }
    });

    return {
      size: this.cache.size,
      oldestEntry: oldest,
    };
  }
}

export default PrioritizerAgent;