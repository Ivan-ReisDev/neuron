export const EMAIL_SERVICE = 'EMAIL_SERVICE';

export interface EmailAttachment {
  filename: string;
  path: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context?: Record<string, unknown>;
  attachments?: EmailAttachment[];
}

export interface EmailTemplate {
  render(context: Record<string, unknown>): string;
  getAttachments?(): EmailAttachment[];
}
