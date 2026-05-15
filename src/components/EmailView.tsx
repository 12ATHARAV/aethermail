import { useState, useEffect } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { format } from 'date-fns';
import type { Email } from '@/types';
import { useEmail, useAI } from '@/hooks';

interface EmailViewProps {
  email: Email;
  onClose: () => void;
}

interface AISummary {
  summary: string;
  actionRequired: boolean;
  urgency: 'high' | 'medium' | 'low';
}

export function EmailView({ email, onClose }: EmailViewProps) {
  const { markRead, archive, remove, label, emails: allEmails } = useEmail();
  const { summarizeThread, isProcessing: isSummarizing } = useAI();

  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const [showThread, setShowThread] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  useEffect(() => {
    if (email.body) {
      DOMPurify.sanitize(email.body);
    }
  }, [email.body]);

  const handleSummarize = async () => {
    const result = await summarizeThread([email]);
    if (result) {
      setAiSummary({
        summary: result,
        actionRequired: result.includes('action') || result.includes('please'),
        urgency: result.includes('urgent') || result.includes('asap') ? 'high' :
                 result.includes('important') ? 'medium' : 'low',
      });
    }
  };

  const handleDraftReply = () => {
    // This would open ComposeModal with prefilled data
    console.log('Draft reply for:', email.id);
  };

  const handleArchive = () => {
    archive(email.id);
    onClose();
  };

  const handleDelete = () => {
    remove(email.id);
    onClose();
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
      default: return 'border-l-gray-300';
    }
  };

  const threadEmails = allEmails.filter(e => e.threadId === email.threadId);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            ←
          </button>
          <button
            onClick={onClose}
            className="hidden md:block p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleArchive} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Archive">
            📁
          </button>
          <button onClick={handleDelete} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-red-500" title="Delete">
            🗑
          </button>
          <div className="relative">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Labels"
            >
              🏷
            </button>
            {showLabels && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                {['Important', 'Work', 'Personal', 'Travel'].map((l) => (
                  <button
                    key={l}
                    onClick={() => { label(email.id, l); setShowLabels(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* AI Summary Card */}
        {aiSummary && showSummary && (
          <div className={`p-4 border-b-4 ${getUrgencyColor(aiSummary.urgency)}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <span>✨</span> AI Summary
                {aiSummary.urgency === 'high' && <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">High Priority</span>}
              </h3>
              <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{aiSummary.summary}</p>
            {aiSummary.actionRequired && (
              <p className="text-sm text-primary-600 dark:text-primary-400 mt-2 flex items-center gap-1">
                <span>⚡</span> Action may be required
              </p>
            )}
          </div>
        )}

        {/* Email Header */}
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg font-medium flex-shrink-0">
              {email.from.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{email.from.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{email.from.email}</p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {format(email.date, 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">To: {email.to.map(t => t.email).join(', ')}</span>
                {email.cc && email.cc.length > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Cc: {email.cc.map(c => c.email).join(', ')}</span>
                )}
              </div>
              <h1 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">{email.subject}</h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              {isSummarizing ? (
                <><span className="animate-spin">⏳</span> Summarizing...</>
              ) : (
                <><span>✨</span> Summarize</>
              )}
            </button>
            <button
              onClick={handleDraftReply}
              className="px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-1 transition-colors"
            >
              <span>✏️</span> Draft Reply
            </button>
            {threadEmails.length > 1 && (
              <button
                onClick={() => setShowThread(!showThread)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {showThread ? 'Hide Thread' : `Show Thread (${threadEmails.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Email Body */}
        <div className="px-4 pb-8">
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: email.htmlBody
                ? DOMPurify.sanitize(email.htmlBody)
                : DOMPurify.sanitize(email.body.replace(/\n/g, '<br>'))
            }}
          />
        </div>

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <div className="px-4 pb-8">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Attachments ({email.attachments.length})</h3>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-lg">📎</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{att.filename}</p>
                    <p className="text-xs text-gray-500">{Math.round(att.size / 1024)} KB</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thread Messages */}
        {showThread && threadEmails.length > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <h3 className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800">
              Thread ({threadEmails.length} messages)
            </h3>
            {threadEmails.map((threadEmail, idx) => (
              <div key={threadEmail.id} className={`p-4 border-b border-gray-100 dark:border-gray-800 ${threadEmail.id === email.id ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm">
                    {threadEmail.from.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{threadEmail.from.name}</p>
                    <p className="text-xs text-gray-500">{format(threadEmail.date, 'MMM d, h:mm a')}</p>
                  </div>
                  {idx === 0 && <span className="text-xs text-primary-500">Latest</span>}
                </div>
                <div className="ml-11 text-sm text-gray-600 dark:text-gray-300">
                  {threadEmail.body.substring(0, 200)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Reply */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDraftReply}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            ✏️ Reply
          </button>
          <button
            onClick={handleDraftReply}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            ↩️ Reply All
          </button>
          <button
            onClick={handleDraftReply}
            className="flex-1 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
          >
            ↪️ Forward
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailView;