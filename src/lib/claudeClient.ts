import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 4096;

interface CallLog {
  timestamp: Date;
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  model: string;
  tokensUsed?: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}

interface RateLimitConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

class ClaudeClient {
  private client: Anthropic | null = null;
  private apiKey: string | null = null;
  private callHistory: CallLog[] = [];
  private lastCallTime: number = 0;
  private minIntervalMs: number = 100; // Rate limiting: min time between calls

  private rateLimitConfig: RateLimitConfig = {
    maxRetries: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
  };

  initialize(apiKey: string): void {
    this.apiKey = apiKey;
    this.client = new Anthropic({
      apiKey,
      maxRetries: this.rateLimitConfig.maxRetries,
    });
    console.log('[ClaudeClient] Initialized with API key');
  }

  isInitialized(): boolean {
    return this.client !== null && this.apiKey !== null;
  }

  /**
   * Main completion function with rate limiting and logging
   */
  async claudeComplete(
    systemPrompt: string,
    userMessage: string,
    maxTokens: number = DEFAULT_MAX_TOKENS
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Claude client not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    const model = DEFAULT_MODEL;

    // Rate limiting: wait if too soon since last call
    const timeSinceLastCall = Date.now() - this.lastCallTime;
    if (timeSinceLastCall < this.minIntervalMs) {
      await this.sleep(this.minIntervalMs - timeSinceLastCall);
    }
    this.lastCallTime = Date.now();

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: 'user', content: userMessage }
        ],
        system: systemPrompt,
      });

      const latencyMs = Date.now() - startTime;
      const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;

      // Log the call
      this.logCall({
        timestamp: new Date(),
        systemPrompt,
        userMessage,
        maxTokens,
        model,
        tokensUsed,
        latencyMs,
        success: true,
      });

      console.log(`[ClaudeClient] ✓ Complete: ${tokensUsed} tokens in ${latencyMs}ms`);

      return response.content[0].type === 'text'
        ? response.content[0].text
        : '';
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logCall({
        timestamp: new Date(),
        systemPrompt,
        userMessage,
        maxTokens,
        model,
        latencyMs,
        success: false,
        error: errorMessage,
      });

      console.error(`[ClaudeClient] ✗ Error: ${errorMessage} after ${latencyMs}ms`);

      // Exponential backoff for rate limiting errors
      if (this.isRateLimitError(error)) {
        const delay = this.calculateBackoff();
        console.log(`[ClaudeClient] Rate limited. Retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.claudeComplete(systemPrompt, userMessage, maxTokens);
      }

      throw error;
    }
  }

  /**
   * Exponential backoff with jitter
   */
  private calculateBackoff(): number {
    const { baseDelayMs, maxDelayMs } = this.rateLimitConfig;
    const attempt = this.callHistory.filter(c => !c.success).length;
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, maxDelayMs);
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof Anthropic.APIError) {
      return error.status === 429 || error.type === 'rate_limit_error';
    }
    return false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log all API calls
   */
  private logCall(log: CallLog): void {
    this.callHistory.push(log);

    // Keep only last 100 calls in memory
    if (this.callHistory.length > 100) {
      this.callHistory = this.callHistory.slice(-100);
    }
  }

  /**
   * Get call history for debugging
   */
  getCallHistory(): CallLog[] {
    return [...this.callHistory];
  }

  /**
   * Get statistics about API usage
   */
  getStats(): { totalCalls: number; successRate: number; avgLatencyMs: number } {
    const totalCalls = this.callHistory.length;
    const successfulCalls = this.callHistory.filter(c => c.success).length;
    const totalLatency = this.callHistory.reduce((sum, c) => sum + c.latencyMs, 0);

    return {
      totalCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      avgLatencyMs: totalCalls > 0 ? totalLatency / totalCalls : 0,
    };
  }

  /**
   * Summarize emails using Claude API
   */
  async summarizeEmails(emails: string[]): Promise<string> {
    const systemPrompt = `You are an expert email summarizer. Analyze the email thread and provide:
1. A concise summary (2-3 sentences)
2. Identify: sender intent, required action, urgency level`;

    const userMessage = emails.map(e => `Email:\n${e}`).join('\n\n---\n\n');

    return this.claudeComplete(systemPrompt, userMessage, 1024);
  }

  /**
   * Draft a reply using Claude API
   */
  async draftReply(emailContent: string, context?: string): Promise<string> {
    const systemPrompt = `You are an AI assistant that drafts email replies.
Generate a professional reply to this email. Match the sender's tone. Keep it concise.`;

    const userContent = context
      ? `Context: ${context}\n\nOriginal email:\n${emailContent}`
      : `Draft a reply to this email:\n${emailContent}`;

    return this.claudeComplete(systemPrompt, userContent, 2048);
  }

  /**
   * Prioritize emails using Claude API - scores 1-10
   */
  async prioritizeEmails(emails: Array<{ subject: string; snippet: string; from: string }>): Promise<number[]> {
    const systemPrompt = `You are an AI assistant that prioritizes emails.
Score each email 1-10 for urgency (10 = most urgent).
Consider: time sensitivity, sender importance, action required, and topic urgency.
Respond with only space-separated priority scores, one per email.`;

    const emailList = emails.map((e, i) =>
      `${i + 1}. From: ${e.from}\n   Subject: ${e.subject}\n   Preview: ${e.snippet}`
    ).join('\n');

    const response = await this.claudeComplete(
      systemPrompt,
      `Score these emails for urgency (1-10):\n\n${emailList}`,
      512
    );

    const priorities = response.match(/\d+/g)?.map(Number) || [];
    return priorities.slice(0, emails.length);
  }
}

export const claudeClient = new ClaudeClient();
export default claudeClient;