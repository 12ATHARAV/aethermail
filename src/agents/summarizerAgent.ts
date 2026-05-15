import { BaseAgent } from './baseAgent';
import { claudeClient } from '@/lib';
import type { Email, AgentResult } from '@/types';

interface SummarizeInput {
  emails: Email[];
  options?: {
    maxLength?: number;
    format?: 'bullet' | 'paragraph';
  };
}

interface SummarizerResult {
  summary: string;
  actionRequired: boolean;
  urgency: 'high' | 'medium' | 'low';
  keyPoints?: string[];
  actionItems?: string[];
}

/**
 * SummarizerAgent - AI-powered email thread summarization
 * Returns summary with action required and urgency level
 */
export class SummarizerAgent extends BaseAgent {
  async execute(input: unknown): Promise<AgentResult<SummarizerResult>> {
    const { emails, options = {} } = input as SummarizeInput;

    if (emails.length === 0) {
      return {
        success: true,
        data: {
          summary: 'No emails to summarize.',
          actionRequired: false,
          urgency: 'low',
          keyPoints: [],
          actionItems: [],
        },
      };
    }

    // Format email content for Claude
    const emailContents = emails.map((e, i) =>
      `--- Email ${i + 1} ---\nFrom: ${e.from.name} <${e.from.email}>\nSubject: ${e.subject}\nDate: ${e.date.toISOString()}\n\n${e.body || e.snippet}`
    ).join('\n\n');

    // Specific Claude prompt as per requirements
    const systemPrompt = `You are an expert email summarizer. Analyze the email thread and provide:
1. A concise summary in 2-3 sentences
2. Identify: sender intent, required action, urgency level

Respond in this exact JSON format:
{"summary": "...", "actionRequired": true/false, "urgency": "high/medium/low", "keyPoints": [...], "actionItems": [...]}`;

    const userMessage = `Summarize this email thread:\n\n${emailContents}`;

    try {
      const response = await claudeClient.claudeComplete(
        systemPrompt,
        userMessage,
        1024
      );

      // Parse JSON response
      let parsed: Partial<SummarizerResult>;
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback: extract information manually
        console.warn('[SummarizerAgent] Failed to parse JSON, using fallback');
        parsed = this.parseFallback(response);
      }

      const result: SummarizerResult = {
        summary: parsed.summary || response.substring(0, 200),
        actionRequired: parsed.actionRequired ?? false,
        urgency: parsed.urgency || 'low',
        keyPoints: parsed.keyPoints || [],
        actionItems: parsed.actionItems || [],
      };

      console.log(`[SummarizerAgent] Summary: actionRequired=${result.actionRequired}, urgency=${result.urgency}`);

      return {
        success: true,
        data: result,
        metadata: {
          emailCount: emails.length,
          threadId: emails[0]?.threadId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate summary',
      };
    }
  }

  /**
   * Fallback parser when JSON parsing fails
   */
  private parseFallback(response: string): Partial<SummarizerResult> {
    const lowerResponse = response.toLowerCase();

    // Detect action required
    const actionKeywords = ['action required', 'please', 'need to', 'must', 'should', 'deadline'];
    const actionRequired = actionKeywords.some(k => lowerResponse.includes(k));

    // Detect urgency
    let urgency: 'high' | 'medium' | 'low' = 'low';
    if (lowerResponse.includes('urgent') || lowerResponse.includes('asap') || lowerResponse.includes('critical')) {
      urgency = 'high';
    } else if (lowerResponse.includes('important') || lowerResponse.includes('soon')) {
      urgency = 'medium';
    }

    // Extract first few sentences as summary
    const sentences = response.split(/[.!?]+/).filter(s => s.trim());
    const summary = sentences.slice(0, 3).join('. ').trim();

    return {
      summary: summary || response.substring(0, 200),
      actionRequired,
      urgency,
    };
  }
}

export default SummarizerAgent;