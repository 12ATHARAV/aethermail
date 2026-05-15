import { SimpleEventEmitter } from '@/lib/eventEmitter';
import { BaseAgent } from './baseAgent';
import { InboxAgent } from './inboxAgent';
import { SummarizerAgent } from './summarizerAgent';
import { DrafterAgent } from './drafterAgent';
import { PrioritizerAgent } from './prioritizerAgent';
import { SearchAgent } from './searchAgent';
import type { AgentResult, AgentTask, TaskType } from '@/types/agent';

interface OrchestratorInput {
  task: AgentTask;
  context?: {
    emails?: unknown[];
    accounts?: unknown[];
  };
}

interface TaskQueueItem {
  task: AgentTask;
  context?: {
    emails?: unknown[];
    accounts?: unknown[];
  };
}

/**
 * OrchestratorAgent - Central task router with priority queue and EventEmitter
 */
export class OrchestratorAgent extends BaseAgent {
  private inboxAgent: InboxAgent;
  private summarizerAgent: SummarizerAgent;
  private drafterAgent: DrafterAgent;
  private prioritizerAgent: PrioritizerAgent;
  private searchAgent: SearchAgent;
  private eventEmitter: SimpleEventEmitter;
  private taskQueue: TaskQueueItem[] = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    super({ name: 'OrchestratorAgent', timeout: 60000 });
    this.inboxAgent = new InboxAgent();
    this.summarizerAgent = new SummarizerAgent();
    this.drafterAgent = new DrafterAgent();
    this.prioritizerAgent = new PrioritizerAgent();
    this.searchAgent = new SearchAgent();
    this.eventEmitter = new SimpleEventEmitter();

    // Set up event listeners for UI updates
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for real-time UI updates
   */
  private setupEventHandlers(): void {
    this.eventEmitter.on('task:start', (task: AgentTask) => {
      console.log(`[Orchestrator] Task started: ${task.type}`);
    });

    this.eventEmitter.on('task:complete', (task: AgentTask, result: AgentResult) => {
      console.log(`[Orchestrator] Task completed: ${task.type}`, result.success ? '✓' : '✗');
    });

    this.eventEmitter.on('task:error', (task: AgentTask, error: string) => {
      console.error(`[Orchestrator] Task error: ${task.type}`, error);
    });
  }

  /**
   * Get the event emitter for external listeners
   */
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  /**
   * Main execute method - routes task to correct agent based on task.type
   */
  async execute(input: unknown): Promise<AgentResult> {
    const { task, context = {} } = input as OrchestratorInput;

    // Emit task start event
    this.eventEmitter.emit('task:start', task);

    const taskHandlers: Record<TaskType, () => Promise<AgentResult>> = {
      sync_emails: () => {
        this.eventEmitter.emit('sync:start', context.accounts);
        return this.inboxAgent.run({ accounts: context.accounts });
      },
      summarize_thread: () => {
        this.eventEmitter.emit('summarize:start', context.emails);
        return this.summarizerAgent.run({ emails: context.emails });
      },
      draft_reply: () => {
        this.eventEmitter.emit('draft:start', task.payload);
        return this.drafterAgent.run(task.payload);
      },
      prioritize_emails: () => {
        this.eventEmitter.emit('prioritize:start', context.emails);
        return this.prioritizerAgent.run({ emails: context.emails });
      },
      search_emails: () => {
        this.eventEmitter.emit('search:start', task.payload);
        return this.searchAgent.run({
          query: (task.payload as { query?: string })?.query || '',
          emails: context.emails || [],
        });
      },
      archive_email: () => this.handleArchive(task.payload),
      delete_email: () => this.handleDelete(task.payload),
      apply_label: () => this.handleApplyLabel(task.payload),
    };

    const handler = taskHandlers[task.type];
    if (!handler) {
      const error = `Unknown task type: ${task.type}`;
      this.eventEmitter.emit('task:error', task, error);
      return { success: false, error };
    }

    try {
      const result = await handler();
      this.eventEmitter.emit('task:complete', task, result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.eventEmitter.emit('task:error', task, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Add task to priority queue
   * Tasks are sorted by priority before processing
   */
  enqueueTask(task: AgentTask, context?: { emails?: unknown[]; accounts?: unknown[] }): void {
    this.taskQueue.push({ task, context });
    // Sort by priority (higher priority first)
    this.taskQueue.sort((a, b) => b.task.priority - a.task.priority);
    console.log(`[Orchestrator] Task enqueued: ${task.type} (priority: ${task.priority})`);

    // Process queue if not already processing
    this.processQueue();
  }

  /**
   * Process all queued tasks in priority order
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    this.eventEmitter.emit('queue:start', this.taskQueue.length);

    while (this.taskQueue.length > 0) {
      const item = this.taskQueue.shift();
      if (!item) break;

      try {
        await this.execute(item);
      } catch (error) {
        console.error('[Orchestrator] Queue task error:', error);
      }
    }

    this.isProcessingQueue = false;
    this.eventEmitter.emit('queue:complete');
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): { pending: number; processing: boolean } {
    return {
      pending: this.taskQueue.length,
      processing: this.isProcessingQueue,
    };
  }

  /**
   * Clear all pending tasks
   */
  clearQueue(): void {
    const count = this.taskQueue.length;
    this.taskQueue = [];
    console.log(`[Orchestrator] Queue cleared: ${count} tasks removed`);
  }

  private async handleArchive(payload: unknown): Promise<AgentResult> {
    const { emailId, provider } = payload as { emailId: string; provider: string };
    console.log(`[Orchestrator] Archiving email: ${emailId}`);
    this.eventEmitter.emit('email:archived', emailId);
    return { success: true, data: { archived: true, emailId }, metadata: { provider } };
  }

  private async handleDelete(payload: unknown): Promise<AgentResult> {
    const { emailId, provider } = payload as { emailId: string; provider: string };
    console.log(`[Orchestrator] Deleting email: ${emailId}`);
    this.eventEmitter.emit('email:deleted', emailId);
    return { success: true, data: { deleted: true, emailId }, metadata: { provider } };
  }

  private async handleApplyLabel(payload: unknown): Promise<AgentResult> {
    const { emailId, label, provider } = payload as { emailId: string; label: string; provider: string };
    console.log(`[Orchestrator] Applying label: ${label} to ${emailId}`);
    this.eventEmitter.emit('email:labeled', emailId, label);
    return { success: true, data: { labeled: true, emailId, label }, metadata: { provider } };
  }

  // Agent accessors
  getInboxAgent(): InboxAgent {
    return this.inboxAgent;
  }

  getSummarizerAgent(): SummarizerAgent {
    return this.summarizerAgent;
  }

  getDrafterAgent(): DrafterAgent {
    return this.drafterAgent;
  }

  getPrioritizerAgent(): PrioritizerAgent {
    return this.prioritizerAgent;
  }

  getSearchAgent(): SearchAgent {
    return this.searchAgent;
  }

  registerProviderAdapter(provider: string, adapter: unknown): void {
    this.inboxAgent.registerAdapter(provider as 'gmail' | 'outlook' | 'imap', adapter as never);
  }
}

export default OrchestratorAgent;