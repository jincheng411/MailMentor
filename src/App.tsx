import React, { useState } from 'react';
import { Inbox, Settings, LogOut, LogIn } from 'lucide-react';
import { EmailList } from './components/EmailList';
import { EmailViewer } from './components/EmailViewer';
import { useGmail } from './hooks/useGmail';
import type { Email } from './types';

function App() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const {
    emails,
    loading,
    error,
    isInitialized,
    isAuthenticated,
    hasMore,
    authenticate,
    refreshEmails,
    loadMoreEmails,
    sendReply,
  } = useGmail();

  const handleSendReply = async (reply: string) => {
    if (selectedEmail) {
      const success = await sendReply(selectedEmail.id, reply);
      if (success) {
        setSelectedEmail(null);
      }
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing Gmail service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Inbox className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  AI Email Replier
                </span>
              </div>
            </div>
            <div className="flex items-center">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={refreshEmails}
                    className="p-2 text-gray-400 hover:text-gray-500"
                    disabled={loading}
                  >
                    <Settings className="h-6 w-6" />
                  </button>
                  <button className="ml-4 p-2 text-gray-400 hover:text-gray-500">
                    <LogOut className="h-6 w-6" />
                  </button>
                </>
              ) : (
                <button
                  onClick={authenticate}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {isAuthenticated ? (
          <div className="bg-white rounded-lg shadow flex h-[calc(100vh-10rem)]">
            <div className="w-1/3 border-r border-gray-200">
              <EmailList
                emails={emails}
                onSelectEmail={setSelectedEmail}
                selectedEmailId={selectedEmail?.id}
                onLoadMore={loadMoreEmails}
                hasMore={hasMore}
                loading={loading}
              />
            </div>
            <div className="w-2/3">
              <EmailViewer
                email={selectedEmail}
                onSendReply={handleSendReply}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to AI Email Replier
            </h2>
            <p className="text-gray-600 mb-8">
              Please sign in with your Google account to access your emails.
            </p>
            <button
              onClick={authenticate}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
