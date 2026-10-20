import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { AppError } from '../../utils/appError.util';
import { comparePassword, hashPassword } from '../../utils/hash.util';
import { verifyTwoFactorTokenOrThrow } from '../../utils/jwt.util';
import { userRepository } from '../user/user.repository';
import { createSession } from '../user/user.service';
import type {
  DisableTwoFactorInput,
  EnableTwoFactorInput,
  LoginTwoFactorInput,
} from './twoFactor.validation';

const ISSUER = 'AideFlash';
const BACKUP_CODES_COUNT = 8;

// Tolère un décalage d'horloge de ±30 secondes entre le serveur et le téléphone
authenticator.options = { window: 1 };

const generateBackupCode = (): string => {
  const raw = crypto.randomBytes(4).toString('hex');
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
};

const isTotpCode = (code: string): boolean => /^\d{6}$/.test(code);

interface TwoFactorUser {
  id: number;
  twoFactorSecret: string | null;
  twoFactorBackupCodes: string[];
}

export class TwoFactorService {
  async setup(userId: number) {
    const user = await this.findUserOrThrow(userId);

    if (user.isTwoFactorEnabled) {
      throw new AppError('two-factor authentication is already enabled', 400);
    }

    // Nouveau secret à chaque configuration : il ne devient actif qu'après validation d'un code
    const secret = authenticator.generateSecret();
    await userRepository.update(userId, { twoFactorSecret: secret });

    const otpauthUrl = authenticator.keyuri(user.email, ISSUER, secret);

    return {
      secret,
      otpauthUrl,
      qrCode: await QRCode.toDataURL(otpauthUrl),
    };
  }

  async enable(userId: number, { code }: EnableTwoFactorInput) {
    const user = await this.findUserOrThrow(userId);

    if (user.isTwoFactorEnabled) {
      throw new AppError('two-factor authentication is already enabled', 400);
    }

    if (!user.twoFactorSecret) {
      throw new AppError('two-factor setup has not been started', 400);
    }

    if (!authenticator.check(code, user.twoFactorSecret)) {
      throw new AppError('invalid two-factor code', 400);
    }

    const backupCodes = Array.from({ length: BACKUP_CODES_COUNT }, generateBackupCode);

    await userRepository.update(userId, {
      isTwoFactorEnabled: true,
      twoFactorBackupCodes: backupCodes.map((backupCode) => hashPassword(backupCode)),
    });

    // Les codes de secours ne sont affichés qu'une seule fois
    return { backupCodes };
  }

  async disable(userId: number, { password, code }: DisableTwoFactorInput) {
    const user = await this.findUserOrThrow(userId);

    if (!user.isTwoFactorEnabled) {
      throw new AppError('two-factor authentication is not enabled', 400);
    }

    if (!comparePassword(password, user.password)) {
      throw new AppError('password is incorrect', 400);
    }

    if (!(await this.verifyAndConsumeCode(user, code))) {
      throw new AppError('invalid two-factor code', 400);
    }

    await userRepository.update(userId, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    });
  }

  async login({ twoFactorToken, code }: LoginTwoFactorInput) {
    const userId = verifyTwoFactorTokenOrThrow(twoFactorToken);
    const user = await userRepository.findById(userId);

    if (!user || !user.isTwoFactorEnabled) {
      throw new AppError('two-factor session expired, please log in again', 401);
    }

    if (!(await this.verifyAndConsumeCode(user, code))) {
      throw new AppError('invalid two-factor code', 401);
    }

    return createSession(user);
  }

  // Accepte un code TOTP, ou un code de secours qui est alors supprimé
  private async verifyAndConsumeCode(user: TwoFactorUser, code: string): Promise<boolean> {
    if (isTotpCode(code)) {
      return !!user.twoFactorSecret && authenticator.check(code, user.twoFactorSecret);
    }

    const normalized = code.toLowerCase();
    const index = user.twoFactorBackupCodes.findIndex((hash) => comparePassword(normalized, hash));
    if (index === -1) {
      return false;
    }

    await userRepository.update(user.id, {
      twoFactorBackupCodes: user.twoFactorBackupCodes.filter((_, i) => i !== index),
    });
    return true;
  }

  private async findUserOrThrow(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('user not found', 404);
    }
    return user;
  }
}

export const twoFactorService = new TwoFactorService();
