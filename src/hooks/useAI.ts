import { useState, useCallback } from 'react';
import { OrchestratorAgent } from '@/agents';
import { claudeClient } from '@/lib';
import { useEmailStore } from '@/stores/emailStore';
import type { Email } from '@/types';

interface UseAIReturn {
  isProcessing: boolean;
  error: string | null;
  summarizeThread: (emails: Email[]) => Promise<string | null>;
  draftReply: (email: Email, context?: string) => Promise<string | null>;
  prioritizeEmails: () => Promise<void>;
  generateSubject: (content: string) => Promise<string | null>;
}

export function useAI(): UseAIReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { emails, setEmails } = useEmailStore();

  const orchestrator = new OrchestratorAgent();

  const summarizeThread = useCallback(async (threadEmails: Email[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await orchestrator.getSummarizerAgent().run({ emails: threadEmails });
      if (result.success && result.data) {
        return result.data.summary;
      }
      setError(result.error || 'Failed to summarize');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const draftReply = useCallback(async (email: Email, context?: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await orchestrator.getDrafterAgent().run({ originalEmail: email, context });
      if (result.success && result.data) {
        return result.data.draft;
      }
      setError(result.error || 'Failed to draft reply');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const prioritizeEmails = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await orchestrator.getPrioritizerAgent().run({ emails });
      if (result.success && result.data) {
        const prioritized = result.data.prioritized;
        const priorityMap = new Map(prioritized.map(p => [p.email.id, p.priority]));
        setEmails(emails.map(e => ({
          ...e,
          priority: priorityMap.get(e.id),
        })));
      } else {
        setError(result.error || 'Failed to prioritize');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  }, [emails, setEmails]);

  const generateSubject = useCallback(async (content: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const subject = await claudeClient.generateText({
        system: 'Generate a concise email subject line from the content.',
        messages: [{ role: 'user', content: `Subject for this email:\n\n${content.slice(0, 500)}` }],
        max_tokens: 100,
      });
      return subject.trim();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    error,
    summarizeThread,
    draftReply,
    prioritizeEmails,
    generateSubject,
  };
}

export default useAI;