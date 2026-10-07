/**
 * Google Workspace Service
 * Supports:
 * - Gmail: List recent emails/threads, compose and send storyboard drafts or pitches
 * - Google Calendar: List events, schedule production review screenings or rendering sessions
 */

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  location?: string;
}

/**
 * List messages from Gmail
 */
export async function listGmailMessages(
  accessToken: string,
  maxResults = 10,
  query = ''
): Promise<GmailMessageItem[]> {
  const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${qParam}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gmail API error (${res.status})`);
  }

  const data = await res.json();
  const messages: { id: string; threadId: string }[] = data.messages || [];

  // Fetch headers for each message to display Subject, From, Date
  const detailed = await Promise.all(
    messages.slice(0, 10).map(async (msg) => {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!msgRes.ok) return { id: msg.id, threadId: msg.threadId };
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
        const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
        const date = headers.find((h: any) => h.name === 'Date')?.value || '';
        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: msgData.snippet || '',
          subject,
          from,
          date,
        };
      } catch {
        return { id: msg.id, threadId: msg.threadId };
      }
    })
  );

  return detailed;
}

/**
 * Get authenticated user's Gmail profile
 */
export async function getUserGmailProfile(accessToken: string): Promise<{
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
}> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gmail Profile error (${res.status})`);
  }
  return await res.json();
}

/**
 * Get detailed message content by ID
 */
export async function getGmailMessageDetails(
  accessToken: string,
  messageId: string
): Promise<{
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
}> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch message details (${res.status})`);
  }
  const data = await res.json();
  const headers = data.payload?.headers || [];
  const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
  const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
  const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
  const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

  // Extract body text
  let body = data.snippet || '';
  const extractTextPart = (part: any): string => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      try {
        return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } catch {
        return '';
      }
    }
    if (part.parts && Array.isArray(part.parts)) {
      for (const subPart of part.parts) {
        const text = extractTextPart(subPart);
        if (text) return text;
      }
    }
    return '';
  };

  const parsedBody = extractTextPart(data.payload);
  if (parsedBody) {
    body = parsedBody;
  }

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet || '',
    subject,
    from,
    to,
    date,
    body,
  };
}

/**
 * Create a draft email in Gmail
 */
export async function createGmailDraft(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<{ id: string; message: { id: string; threadId: string } }> {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const emailLines = [
    to ? `To: ${to}` : '',
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText,
  ].filter((line, idx) => idx > 0 || line !== '');

  const emailRaw = emailLines.join('\r\n');
  const base64Safe = btoa(unescape(encodeURIComponent(emailRaw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw: base64Safe } }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Gmail draft (${res.status})`);
  }

  return await res.json();
}

/**
 * Send an email via Gmail API
 * Note: requires explicit user confirmation before calling per destructive/mutating policy
 */
export async function sendGmailMessage(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<{ id: string }> {
  // Construct RFC 2822 email
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText,
  ];

  const emailRaw = emailLines.join('\r\n');
  // Base64url encode
  const base64Safe = btoa(unescape(encodeURIComponent(emailRaw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64Safe }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email via Gmail (${res.status})`);
  }

  return await res.json();
}

/**
 * List events from primary Google Calendar
 */
export async function listCalendarEvents(
  accessToken: string,
  maxResults = 10
): Promise<CalendarEventItem[]> {
  const timeMin = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Calendar API error (${res.status})`);
  }

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary || '(Untitled Event)',
    description: item.description,
    start: item.start || {},
    end: item.end || {},
    htmlLink: item.htmlLink,
    location: item.location,
  }));
}

/**
 * Schedule a Storyboard Screening / Review event in Google Calendar
 * Note: requires explicit user confirmation before calling
 */
export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    location?: string;
  }
): Promise<CalendarEventItem> {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  const body = {
    summary: event.summary,
    description: event.description,
    start: { dateTime: event.startTime },
    end: { dateTime: event.endTime },
    location: event.location || 'StoryCast Virtual Studio',
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to schedule event in Google Calendar (${res.status})`);
  }

  return await res.json();
}
