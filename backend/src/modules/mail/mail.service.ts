import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

// Messages envoyés pendant les tests (aucun envoi réel), consultables par les tests
export const sentMailsForTests: MailMessage[] = [];

export const mailService = {
  async send(message: MailMessage): Promise<void> {
    if (env.NODE_ENV === 'test') {
      sentMailsForTests.push(message);
      return;
    }

    // Pas de serveur SMTP configuré : le contenu (et donc le lien) est visible dans les logs
    if (!env.SMTP_HOST) {
      console.info(`[mail] SMTP non configuré, email non envoyé à ${message.to}\n${message.text}`);
      return;
    }

    await getTransporter().sendMail({ from: env.MAIL_FROM, ...message });
  },
};
