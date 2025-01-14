import { useState, useEffect } from 'react';
import { GmailService } from '../services/gmail';
import type { Email } from '../types';

export function useGmail() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const gmail = GmailService.getInstance();

  useEffect(() => {
    initializeGmail();
  }, []);

  async function initializeGmail() {
    try {
      await gmail.initialize();
      setIsInitialized(true);
    } catch (err) {
      setError('Failed to initialize Gmail service');
      console.error(err);
    }
  }

  async function authenticate() {
    try {
      await gmail.authenticate();
      setIsAuthenticated(true);
      await loadEmails();
    } catch (err) {
      setError('Authentication failed');
      console.error(err);
    }
  }

  async function loadEmails(loadMore = false) {
    if (!gmail.isAuthenticated()) {
      setError('Please authenticate first');
      return;
    }

    try {
      setLoading(true);
      const result = await gmail.listEmails(20, loadMore ? pageToken : null);

      if (loadMore) {
        setEmails((prev) => [...prev, ...result.emails]);
      } else {
        setEmails(result.emails);
      }

      setPageToken(result.nextPageToken);
      setHasMore(!!result.nextPageToken);
      setError(null);
    } catch (err) {
      setError('Failed to load emails');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreEmails() {
    if (hasMore && !loading) {
      await loadEmails(true);
    }
  }

  async function sendReply(emailId: string, replyBody: string) {
    if (!gmail.isAuthenticated()) {
      setError('Please authenticate first');
      return false;
    }

    try {
      await gmail.sendReply(emailId, replyBody);
      await loadEmails();
      return true;
    } catch (err) {
      setError('Failed to send reply');
      console.error(err);
      return false;
    }
  }

  return {
    emails,
    loading,
    error,
    isInitialized,
    isAuthenticated,
    hasMore,
    authenticate,
    refreshEmails: () => loadEmails(false),
    loadMoreEmails,
    sendReply,
  };
}
