import type { Email } from '../types';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const DISCOVERY_DOC =
  'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';
const SCOPES = 'https://www.googleapis.com/auth/gmail.modify';

export class GmailService {
  private static instance: GmailService;
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private gapiInited = false;
  private gisInited = false;
  private accessToken: string | null = null;

  private constructor() {}

  public static getInstance(): GmailService {
    if (!GmailService.instance) {
      GmailService.instance = new GmailService();
    }
    return GmailService.instance;
  }

  public async initialize(): Promise<void> {
    if (!CLIENT_ID || !API_KEY) {
      throw new Error(
        'Google credentials not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY in your .env file.'
      );
    }
    console.log('Initializing Gmail service...');
    await this.initializeGapiClient();
    await this.initializeGisClient();
    console.log('Gmail service initialized successfully');
  }

  private async initializeGapiClient(): Promise<void> {
    console.log('Initializing GAPI client...');
    await new Promise<void>((resolve, reject) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
          });
          this.gapiInited = true;
          console.log('GAPI client initialized successfully');
          resolve();
        } catch (err) {
          console.error('Failed to initialize GAPI client:', err);
          reject(err);
        }
      });
    });
  }

  private async initializeGisClient(): Promise<void> {
    console.log('Initializing GIS client...');
    try {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            console.error('Token client callback error:', response.error);
            return;
          }
          this.accessToken = response.access_token;
        },
      });
      this.gisInited = true;
      console.log('GIS client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GIS client:', error);
      throw error;
    }
  }

  private decodeBase64Url(input: string): string {
    try {
      const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(escape(atob(base64)));
    } catch (error) {
      console.error('Failed to decode base64 content:', error);
      return '';
    }
  }

  private getEmailBody(payload: gmail_v1.Schema$MessagePart): string {
    if (!payload) return '';

    // If the payload has a body with data, return its content
    if (payload.body?.data) {
      return this.decodeBase64Url(payload.body.data);
    }

    // If there are parts, recursively search for the content
    if (payload.parts) {
      let htmlContent = '';
      let plainContent = '';

      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          htmlContent = this.decodeBase64Url(part.body.data);
        } else if (part.mimeType === 'text/plain' && part.body?.data) {
          plainContent = this.decodeBase64Url(part.body.data);
        } else if (part.parts) {
          // Recursively check nested parts
          const nestedContent = this.getEmailBody(part);
          if (nestedContent) {
            if (part.mimeType?.includes('html')) {
              htmlContent = nestedContent;
            } else {
              plainContent = nestedContent;
            }
          }
        }
      }

      // Prefer HTML content over plain text
      return htmlContent || plainContent;
    }

    return '';
  }

  public async authenticate(): Promise<void> {
    if (!this.tokenClient) {
      throw new Error('Token client not initialized');
    }

    console.log('Starting authentication...');
    return new Promise<void>((resolve, reject) => {
      try {
        const handleResponse = (
          response: google.accounts.oauth2.TokenResponse
        ) => {
          if (response.error) {
            console.error('Authentication error:', response.error);
            reject(new Error(`Authentication failed: ${response.error}`));
            return;
          }
          this.accessToken = response.access_token;
          console.log('Authentication successful');
          resolve();
        };

        this.tokenClient!.callback = handleResponse;

        console.log('Requesting access token...');
        this.tokenClient!.requestAccessToken({
          prompt: 'consent',
        });
      } catch (error) {
        console.error('Failed to request access token:', error);
        reject(new Error('Failed to request access token'));
      }
    });
  }

  public async listEmails(
    maxResults = 20,
    pageToken?: string | null
  ): Promise<{
    emails: Email[];
    nextPageToken: string | null;
  }> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const response = await gapi.client.gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken: pageToken || undefined,
    });

    const emails: Email[] = [];
    for (const message of response.result.messages || []) {
      const email = await gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full',
      });

      const headers = email.result.payload?.headers;
      const subject = headers?.find((h) => h.name === 'Subject')?.value || '';
      const from = headers?.find((h) => h.name === 'From')?.value || '';
      const date = headers?.find((h) => h.name === 'Date')?.value || '';

      const body = email.result.payload
        ? this.getEmailBody(email.result.payload)
        : '';

      emails.push({
        id: message.id!,
        subject,
        body,
        sender: from,
        timestamp: new Date(date).toISOString(),
        read: !email.result.labelIds?.includes('UNREAD'),
      });
    }

    return {
      emails,
      nextPageToken: response.result.nextPageToken || null,
    };
  }

  public async sendReply(emailId: string, replyBody: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const originalEmail = await gapi.client.gmail.users.messages.get({
      userId: 'me',
      id: emailId,
    });

    const headers = originalEmail.result.payload?.headers;
    const to = headers?.find((h) => h.name === 'From')?.value;
    const subject = headers?.find((h) => h.name === 'Subject')?.value;
    const references = headers?.find((h) => h.name === 'Message-ID')?.value;

    const email = [
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: Re: ${subject}`,
      `References: ${references}`,
      'Content-Transfer-Encoding: 7bit',
      '',
      replyBody,
    ].join('\n');

    const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');

    await gapi.client.gmail.users.messages.send({
      userId: 'me',
      resource: {
        raw: encodedEmail,
        threadId: originalEmail.result.threadId,
      },
    });
  }

  public isInitialized(): boolean {
    return this.gapiInited && this.gisInited;
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}
