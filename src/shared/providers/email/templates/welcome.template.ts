import { EmailTemplate } from '../email.interface';

export class WelcomeTemplate implements EmailTemplate {
  render(context: Record<string, unknown>): string {
    const name = (context.name as string) || 'Visitante';

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bem-vindo</title>
        <style>
          body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
          .header { background-color: #1a1a2e; padding: 32px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
          .body { padding: 32px; color: #333333; line-height: 1.6; }
          .body h2 { color: #1a1a2e; margin-top: 0; }
          .body p { margin: 0 0 16px; }
          .footer { background-color: #f4f4f7; padding: 24px 32px; text-align: center; color: #888888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Neuron</h1>
          </div>
          <div class="body">
            <h2>Bem-vindo, ${name}!</h2>
            <p>Obrigado por entrar em contato. Recebi sua mensagem e retornarei o mais breve possível.</p>
            <p>Enquanto isso, fique à vontade para explorar meu portfólio.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Neuron. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
