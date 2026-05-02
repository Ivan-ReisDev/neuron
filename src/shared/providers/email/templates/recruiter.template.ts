import { join } from 'path';
import { EmailAttachment, EmailTemplate } from '../email.interface';

const RESUME_PATH = join(
  process.cwd(),
  'public',
  'CURRICULO - IVAN FERNANDES 2026-03 (1).pdf',
);

export class RecruiterTemplate implements EmailTemplate {
  getAttachments(): EmailAttachment[] {
    return [
      {
        filename: 'Curriculo-Ivan-Reis.pdf',
        path: RESUME_PATH,
      },
    ];
  }

  render(context: Record<string, unknown>): string {
    const recruiterName = context.name ? `, ${context.name as string}` : '';

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Currículo de Ivan Reis</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0">

                <!-- Logo -->
                <tr>
                  <td align="center" style="padding: 32px 32px 16px 32px;">
                    <img src="https://ivanreis.com.br/favicon.png" alt="Logo da Empresa" width="64" height="64" style="display: block;" />
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center" style="padding: 0 32px 8px 32px;">
                    <h1 style="margin: 0; color: #0FA0B8; font-size: 22px; font-weight: 700;">Ivan.dev</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 24px 32px 32px 32px; color: #333333; font-size: 15px; line-height: 1.6;">
                    <p style="margin: 0 0 16px;">Olá${recruiterName},</p>
                    <p style="margin: 0 0 16px;">Estou compartilhando meu currículo em anexo e ficarei feliz em discutir futuras oportunidades que estejam alinhadas ao meu perfil profissional. Caso deseje entrar em contato para uma conversa, estou à disposição.</p>
                    <p style="margin: 0 0 4px;">Atenciosamente,</p>
                    <p style="margin: 0; font-weight: 700;">Ivan Reis</p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 32px;">
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;" />
                  </td>
                </tr>

                <!-- Social Links -->
                <tr>
                  <td align="center" style="padding: 24px 32px;">
                    <p style="margin: 0 0 12px; color: #888888; font-size: 13px;">Conecte-se comigo:</p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 12px;">
                          <a href="https://github.com/Ivan-ReisDev" style="color: #0FA0B8; font-size: 14px; font-weight: 600; text-decoration: none;">GitHub</a>
                        </td>
                        <td style="padding: 0 12px;">
                          <a href="https://www.linkedin.com/in/ivan-reis-b93b32248/" style="color: #0FA0B8; font-size: 14px; font-weight: 600; text-decoration: none;">LinkedIn</a>
                        </td>
                        <td style="padding: 0 12px;">
                          <a href="https://ivanreis.com.br" style="color: #0FA0B8; font-size: 14px; font-weight: 600; text-decoration: none;">Portfólio</a>
                        </td>
                        <td style="padding: 0 12px;">
                          <a href="https://wa.me/5521985598348" style="color: #0FA0B8; font-size: 14px; font-weight: 600; text-decoration: none;">WhatsApp</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 16px 32px 24px 32px;">
                    <p style="margin: 0; color: #888888; font-size: 13px;">Obrigado pela atenção!</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
