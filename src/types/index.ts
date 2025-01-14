export interface Email {
  id: string;
  subject: string;
  body: string;
  sender: string;
  timestamp: string;
  read: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: {
    defaultTone: 'formal' | 'casual' | 'technical';
    autoReply: boolean;
  };
}

export type ReplyTone = 'formal' | 'casual' | 'technical';