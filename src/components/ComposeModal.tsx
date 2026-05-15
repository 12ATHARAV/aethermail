import { useState, useRef, useEffect } from 'react';
import type { Email } from '@/types';
import { useAI } from '@/hooks';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTo?: string;
  initialSubject?: string;
  replyTo?: Email;
}

export function ComposeModal({ isOpen, onClose, initialTo = '', initialSubject = '', replyTo }: ComposeModalProps) {
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [intent, setIntent] = useState('');

  const { generateSubject, draftReply, isProcessing } = useAI();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) {
      setTo(replyTo.from.email);
      setSubject(replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
      setShowIntentModal(false);
    }
  }, [replyTo]);

  const handleGenerateSubject = async () => {
    if (body.trim()) {
      const generated = await generateSubject(body);
      if (generated) setSubject(generated);
    }
  };

  const handleAIDraft = async () => {
    if (!replyTo) {
      setShowIntentModal(true);
      return;
    }

    const draft = await draftReply(replyTo, intent);
    if (draft) {
      setBody(draft);
    }
  };

  const handleIntentSubmit = async () => {
    if (!replyTo) return;

    const draft = await draftReply(replyTo, intent);
    if (draft) {
      setBody(draft);
      setShowIntentModal(false);
      setIntent('');
    }
  };

  const handleSend = async () => {
    if (!to.trim() || !subject.trim()) return;
    setIsSending(true);

    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSending(false);
    onClose();
    // Reset form
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
  };

  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Intent Modal for AI Draft */}
      {showIntentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reply Intent (Optional)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Add context or specify how you'd like to reply. Leave blank for a standard professional response.
            </p>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g., Be more friendly, acknowledge the meeting request, decline the offer politely..."
              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowIntentModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleIntentSubmit}
                disabled={isProcessing}
                className="px-4 py-2 text-sm bg-primary-500 text-white hover:bg-primary-600 rounded-lg disabled:opacity-50"
              >
                {isProcessing ? 'Generating...' : 'Generate Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      <div className={`fixed z-50 bg-white dark:bg-gray-800 shadow-2xl flex flex-col ${
        'md:w-[600px] md:h-[700px] md:rounded-xl md:inset-auto'
      } ${
        'inset-0 md:inset-auto'
      } w-full h-full md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2`}
      style={{ height: '100%', maxHeight: '100%' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {replyTo ? 'Reply' : 'New Message'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">
            ×
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* To */}
          <div className="flex items-center">
            <label className="w-16 text-sm text-gray-600 dark:text-gray-400">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 bg-transparent text-gray-800 dark:text-white outline-none"
              placeholder="recipient@example.com"
            />
          </div>

          {/* CC Toggle */}
          <div className="flex items-center">
            <label className="w-16 text-sm text-gray-600 dark:text-gray-400">Cc</label>
            {!showCc ? (
              <button
                onClick={() => setShowCc(true)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                + Cc
              </button>
            ) : (
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="flex-1 bg-transparent text-gray-800 dark:text-white outline-none"
                placeholder="cc@example.com"
              />
            )}
          </div>

          {/* BCC Toggle */}
          <div className="flex items-center">
            <label className="w-16 text-sm text-gray-600 dark:text-gray-400">Bcc</label>
            {!showBcc ? (
              <button
                onClick={() => setShowBcc(true)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                + Bcc
              </button>
            ) : (
              <input
                type="email"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="flex-1 bg-transparent text-gray-800 dark:text-white outline-none"
                placeholder="bcc@example.com"
              />
            )}
          </div>

          {/* Subject */}
          <div className="flex items-center border-t border-gray-100 dark:border-gray-700 pt-3">
            <label className="w-16 text-sm text-gray-600 dark:text-gray-400">Subject</label>
            <div className="flex-1 flex items-center">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 bg-transparent text-gray-800 dark:text-white outline-none"
                placeholder="Subject"
              />
              <button
                onClick={handleGenerateSubject}
                disabled={!body.trim() || isProcessing}
                className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 disabled:opacity-50"
              >
                {isProcessing ? '...' : '✨ Auto'}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex-1">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-64 md:h-80 resize-none bg-transparent text-gray-800 dark:text-white outline-none"
              placeholder={replyTo ? "Write your reply..." : "Write your message..."}
            />
          </div>

          {/* Autocomplete placeholder */}
          <div className="text-xs text-gray-400">
            Tip: Press Tab to autocomplete from sender history
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg" title="Attach">
              📎
            </button>
            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg" title="Insert image">
              🖼
            </button>
            {replyTo && (
              <button
                onClick={handleAIDraft}
                disabled={isProcessing}
                className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50 flex items-center gap-1"
              >
                <span>✨</span>
                {isProcessing ? 'Drafting...' : 'AI Draft'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              Discard
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !to.trim() || !subject.trim()}
              className="px-4 py-2 text-sm bg-primary-500 text-white hover:bg-primary-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ComposeModal;