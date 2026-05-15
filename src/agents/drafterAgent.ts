import { BaseAgent } from './baseAgent';
import { claudeClient } from '@/lib';
import type { Email, AgentResult } from '@/types';

interface DraftReplyInput {
  originalEmail: Email;
  userIntent?: string;
  tone?: 'formal' | 'casual' | 'friendly' | 'professional';
  length?: 'short' | 'medium' | 'long';
}

interface DraftResult {
  draft: string;
  subject: string;
  tone: string;
  alternatives?: string[];
}

/**
 * DrafterAgent - AI-powered reply drafting with tone matching
 */
export class DrafterAgent extends BaseAgent {
  async execute(input: unknown): Promise<AgentResult<DraftResult>> {
    const { originalEmail, userIntent, tone = 'professional', length = 'medium' } = input as DraftReplyInput;

    const lengthMap = {
      short: 'Keep it brief - 2-3 sentences',
      medium: 'Keep it concise - 1 paragraph',
      long: 'Be thorough - 2-3 paragraphs',
    };

    const toneMap = {
      formal: 'Use formal language, professional greeting, avoid contractions',
      casual: 'Use casual language, friendly tone, conversational',
      friendly: 'Use warm, friendly language, show genuine interest',
      professional: 'Use professional but approachable language, be clear and concise',
    };

    // Format original email content
    const emailContent = `From: ${originalEmail.from.name} <${originalEmail.from.email}>
Subject: ${originalEmail.subject}
Date: ${originalEmail.date.toISOString()}

${originalEmail.body || originalEmail.snippet}`;

    // Specific Claude prompt as per requirements
    const systemPrompt = `You are an AI assistant that drafts email replies.
Draft a professional reply to this email. Match the sender's tone. Keep it concise.

Additional guidance:
- Tone: ${toneMap[tone]}
- Length: ${lengthMap[length]}
- Subject line: Use "Re: " prefix if not already present

Respond in this exact JSON format:
{"draft": "...", "subject": "...", "tone": "..."}`;

    const userContent = userIntent
      ? `User's intent: ${userIntent}\n\nEmail to reply to:\n${emailContent}`
      : `Draft a reply to this email:\n${emailContent}`;

    try {
      const response = await claudeClient.claudeComplete(systemPrompt, userContent, 2048);

      // Parse JSON response
      let parsed: Partial<DraftResult>;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.warn('[DrafterAgent] Failed to parse JSON, using fallback');
        parsed = this.parseFallback(response, originalEmail);
      }

      // Ensure subject has Re: prefix
      const subject = this.ensureSubjectPrefix(parsed.subject || originalEmail.subject);

      const result: DraftResult = {
        draft: parsed.draft || response,
        subject,
        tone: parsed.tone || tone,
        alternatives: this.generateAlternatives(response),
      };

      console.log(`[DrafterAgent] Draft generated: tone=${result.tone}, length=${length}`);

      return {
        success: true,
        data: result,
        metadata: {
          originalSubject: originalEmail.subject,
          requestedTone: tone,
          requestedLength: length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate draft',
      };
    }
  }

  /**
   * Ensure subject line has Re: prefix
   */
  private ensureSubjectPrefix(subject: string): string {
    if (subject.toLowerCase().startsWith('re:')) {
      return subject;
    }
    return `Re: ${subject}`;
  }

  /**
   * Generate alternative draft options
   */
  private generateAlternatives(draft: string): string[] {
    const alternatives: string[] = [];

    // Short version
    const sentences = draft.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 2) {
      alternatives.push(sentences.slice(0, 2).join('. ') + '.');
    }

    // Different phrasing (if there's enough content)
    if (draft.length > 100) {
      alternatives.push(draft.substring(0, Math.min(200, draft.length)) + '...');
    }

    return alternatives.slice(0, 2);
  }

  /**
   * Fallback parser when JSON parsing fails
   */
  private parseFallback(response: string, originalEmail: Email): Partial<DraftResult> {
    // Extract subject line (look for lines starting with Subject:)
    const subjectMatch = response.match(/(?:subject:?\s*)?(re:\s*)?(.+)/i);
    const subject = subjectMatch ? subjectMatch[0] : originalEmail.subject;

    // Detect tone from content
    let detectedTone = 'professional';
    const lowerResponse = response.toLowerCase();

    if (lowerResponse.includes('hey') || lowerResponse.includes('hi there') || lowerResponse.includes('thanks!')) {
      detectedTone = 'casual';
    } else if (lowerResponse.includes('warmly') || lowerResponse.includes('best wishes') || lowerResponse.includes('kind regards')) {
      detectedTone = 'friendly';
    } else if (lowerResponse.includes('sincerely') || lowerResponse.includes('respectfully')) {
      detectedTone = 'formal';
    }

    return {
      draft: response,
      subject: this.ensureSubjectPrefix(subject),
      tone: detectedTone,
    };
  }
}

export default DrafterAgent;