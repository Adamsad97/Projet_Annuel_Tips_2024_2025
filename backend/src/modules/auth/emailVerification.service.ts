import crypto from 'crypto';
import { prisma } from '../../db/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/appError.util';
import { mailService } from '../mail/mail.service';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
// Anti-spam : pas de nouvel email si le précédent a moins d'une minute
const RESEND_COOLDOWN_MS = 60 * 1000;

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

// Activée par défaut ; EMAIL_VERIFICATION=false la désactive (tests existants, démo hors ligne)
export const isEmailVerificationRequired = (): boolean =>
  process.env.EMAIL_VERIFICATION !== 'false';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export const emailVerificationService = {
  // Crée un nouveau lien (les anciens deviennent invalides) et l'envoie par email
  async send(user: { id: number; email: string; username: string }): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');

    await prisma.$transaction([
      prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
      prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      }),
    ]);

    const link = `${env.APP_URL}/auth/verify-email?token=${token}`;
    const name = escapeHtml(user.username);

    await mailService.send({
      to: user.email,
      subject: 'Confirmez votre adresse email - TipsTop',
      text:
        `Bonjour ${user.username},\n\n` +
        `Pour activer votre compte TipsTop, confirmez votre adresse email en ouvrant ce lien :\n${link}\n\n` +
        `Ce lien est valable 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.`,
      html:
        `<p>Bonjour ${name},</p>` +
        `<p>Pour activer votre compte TipsTop, confirmez votre adresse email :</p>` +
        `<p><a href="${link}">Confirmer mon adresse email</a></p>` +
        `<p>Ce lien est valable 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.</p>`,
    });
  },

  async verify(token: string): Promise<void> {
    const stored = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('invalid or expired verification link', 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: stored.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.deleteMany({ where: { userId: stored.userId } }),
    ]);
  },

  // Réponse identique que le compte existe ou non : on ne révèle pas quels emails sont inscrits
  async resend(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        username: true,
        emailVerifiedAt: true,
        emailVerificationTokens: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!user || user.emailVerifiedAt) return;

    const last = user.emailVerificationTokens[0];
    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) return;

    await this.send(user);
  },
};
