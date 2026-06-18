import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// AES-256 encryption helpers for MFA secret
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function encrypt(text: string): string {
  const key = crypto.scryptSync(env.JWT_SECRET, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const key = crypto.scryptSync(env.JWT_SECRET, 'salt', 32);
  const [ivHex, tagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function validateCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  return user;
}

export async function generateTokenPair(userId: string, role: string) {
  const accessToken = jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign({ id: userId, role }, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

  // Store refresh token hash in Redis
  const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await redis.set(`refresh:${userId}`, refreshHash, 'EX', 7 * 24 * 60 * 60); // 7 days

  return { accessToken, refreshToken };
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
    const storedHash = await redis.get(`refresh:${payload.id}`);

    if (!storedHash) return null;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (storedHash !== tokenHash) return null;

    return payload.id;
  } catch {
    return null;
  }
}

export async function generateMfaSecret(userId: string) {
  const secret = authenticator.generateSecret();

  // Encrypt and store the secret
  const encryptedSecret = encrypt(secret);
  await prisma.user.update({
    where: { id: userId },
    data: { mfaSecret: encryptedSecret },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const otpauthUrl = authenticator.keyuri(user?.email || userId, 'Antrosys ERP', secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return { secret, qrCodeDataUrl };
}

export async function verifyMfaToken(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.mfaSecret) return false;

  const secret = decrypt(user.mfaSecret);
  const isValid = authenticator.verify({ token, secret });

  if (isValid && !user.mfaEnabled) {
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });
  }

  return isValid;
}

export async function invalidateSession(userId: string): Promise<void> {
  await redis.del(`refresh:${userId}`);
}
