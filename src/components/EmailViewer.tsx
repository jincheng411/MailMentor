import React, { useState } from 'react';
import { Send, RotateCcw, Edit2 } from 'lucide-react';
import type { Email, ReplyTone } from '../types';
import { generateEmailReply } from '../services/openai';

interface EmailViewerProps {
  email: Email | null;
  onSendReply: (reply: string) => void;
}

function sanitizeHtml(html: string): string {
  // Remove CSS content
  const withoutCss = html.replace(
    /{[^}]*}|@media[^{]*{[^}]*}|<style[^>]*>[^<]*<\/style>/gi,
    ''
  );

  // Remove HTML tags and decode entities
  const doc = new DOMParser().parseFromString(withoutCss, 'text/html');
  const text = doc.body.textContent || '';

  // Clean up whitespace and formatting
  return text
    .replace(/\s*\n\s*\n\s*/g, '\n\n') // Replace multiple newlines with just two
    .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
    .replace(/\n\s+/g, '\n') // Remove whitespace at start of lines
    .replace(/^(?:@|\{|\}|\s)*/, '') // Remove any remaining CSS-like content at start
    .replace(
      /\b(?:padding|margin|width|height|display|overflow|text-align):[^;}\n]+[;}\n]*/g,
      ''
    ) // Remove CSS properties
    .trim();
}

export function EmailViewer({ email, onSendReply }: EmailViewerProps) {
  const [replyContent, setReplyContent] = useState('');
  const [tone, setTone] = useState<ReplyTone>('formal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select an email to view</p>
      </div>
    );
  }

  const handleGenerateReply = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const cleanContent = sanitizeHtml(email.body);
      const generatedReply = await generateEmailReply(cleanContent, tone);
      setReplyContent(generatedReply);
    } catch (err) {
      setError('Failed to generate reply. Please try again.');
      console.error('Error generating reply:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clean and format the email content
  const cleanContent = sanitizeHtml(email.body);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-900">{email.subject}</h2>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <span className="font-medium text-gray-900">{email.sender}</span>
          <span className="mx-2">•</span>
          <span>{new Date(email.timestamp).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="prose max-w-none whitespace-pre-wrap break-words text-gray-800">
            {cleanContent}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0">
        <div className="flex items-center space-x-4 mb-4">
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as ReplyTone)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="technical">Technical</option>
          </select>
          <button
            onClick={handleGenerateReply}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RotateCcw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Generating...
              </>
            ) : (
              <>
                <Edit2 className="-ml-1 mr-2 h-4 w-4" />
                Generate Reply
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="mt-4">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={6}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Write your reply..."
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onSendReply(replyContent)}
            disabled={!replyContent}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Send className="-ml-1 mr-2 h-4 w-4" />
            Send Reply
          </button>
        </div>
      </div>
    </div>
  );
}
