import { EmailTemplate } from '../email.interface';
import { RecruiterTemplate } from './recruiter.template';
import { WelcomeTemplate } from './welcome.template';

const templates = new Map<string, EmailTemplate>([
  ['welcome', new WelcomeTemplate()],
  ['recruiter', new RecruiterTemplate()],
]);

export function getEmailTemplate(name: string): EmailTemplate | undefined {
  return templates.get(name);
}

export function registerEmailTemplate(
  name: string,
  template: EmailTemplate,
): void {
  templates.set(name, template);
}
