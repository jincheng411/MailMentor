import React from 'react';
import { Mail, Star, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Email } from '../types';

interface EmailListProps {
  emails: Email[];
  onSelectEmail: (email: Email) => void;
  selectedEmailId?: string;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function EmailList({
  emails,
  onSelectEmail,
  selectedEmailId,
  onLoadMore,
  hasMore,
  loading,
}: EmailListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {emails.map((email) => (
          <div
            key={email.id}
            className={`flex items-center p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedEmailId === email.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => onSelectEmail(email)}
          >
            <div className="flex-shrink-0 mr-4">
              <Mail
                className={`h-5 w-5 ${
                  email.read ? 'text-gray-400' : 'text-blue-500'
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p
                  className={`text-sm font-medium ${
                    email.read ? 'text-gray-600' : 'text-gray-900'
                  }`}
                >
                  {email.sender}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(email.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <p
                className={`text-sm ${
                  email.read ? 'text-gray-500' : 'text-gray-900'
                }`}
              >
                {email.subject}
              </p>
              <p className="text-sm text-gray-500 truncate">{email.body}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
              <button className="text-gray-400 hover:text-yellow-400">
                <Star className="h-5 w-5" />
              </button>
              <button className="text-gray-400 hover:text-red-400">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <Mail className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Loading...
              </span>
            ) : (
              <span className="flex items-center">
                Load More
                <ChevronRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
