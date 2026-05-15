import type { AgentConfig, AgentResult } from '@/types/agent';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected isRunning: boolean = false;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      name: this.constructor.name,
      enabled: true,
      maxRetries: 3,
      timeout: 30000,
      ...config,
    };
  }

  abstract execute(input: unknown): Promise<AgentResult>;

  async run(input: unknown): Promise<AgentResult> {
    if (!this.config.enabled) {
      return { success: false, error: 'Agent is disabled' };
    }

    this.isRunning = true;
    let attempts = 0;

    while (attempts < this.config.maxRetries) {
      try {
        const result = await this.executeWithTimeout(input);
        this.isRunning = false;
        return result;
      } catch (error) {
        attempts++;
        if (attempts >= this.config.maxRetries) {
          this.isRunning = false;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }
    }

    this.isRunning = false;
    return { success: false, error: 'Max retries exceeded' };
  }

  private async executeWithTimeout(input: unknown): Promise<AgentResult> {
    return Promise.race([
      this.execute(input),
      new Promise<AgentResult>((_, reject) =>
        setTimeout(
          () => reject(new Error('Agent execution timeout')),
          this.config.timeout
        )
      ),
    ]);
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }
}