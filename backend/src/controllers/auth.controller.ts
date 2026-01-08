import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { env } from '../config/env';

// Helper: Generate tokens
const generateAccessToken = (user: { id: string; organizationId: string; role: string }) => {
  return jwt.sign(
    { id: user.id, organizationId: user.organizationId, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

const generateRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, organizationName } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Користувач вже існує' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create organization and user
    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        users: {
          create: {
            email,
            password: hashedPassword,
            name,
            role: 'ADMIN',
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = organization.users[0];

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Помилка реєстрації' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Невірні облікові дані' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Невірні облікові дані' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Помилка входу' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Помилка отримання даних користувача' });
  }
};

// Refresh token endpoint with rotation
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Refresh token обов\'язковий' });
    }

    // Find the refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    // Validate token exists, not revoked, not expired
    if (!storedToken) {
      return res.status(401).json({ message: 'Невірний refresh token' });
    }

    if (storedToken.revokedAt) {
      // Token reuse detected - revoke all user tokens (security measure)
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revokedAt: new Date() },
      });
      return res.status(401).json({ message: 'Token reuse detected. All sessions revoked.' });
    }

    if (storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Refresh token протермінований' });
    }

    // Revoke the old token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const user = storedToken.user;
    const accessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user.id);

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Помилка оновлення токена' });
  }
};

// Logout - revoke current refresh token
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await prisma.refreshToken.updateMany({
        where: { token, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    res.json({ message: 'Вихід успішний' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Помилка виходу' });
  }
};

// Logout from all devices - revoke all user tokens
export const logoutAll = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.refreshToken.updateMany({
      where: { userId: req.user!.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    res.json({ message: 'Вихід з усіх пристроїв успішний' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Помилка виходу з усіх пристроїв' });
  }
};
