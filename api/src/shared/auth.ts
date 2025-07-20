import jwt from 'jsonwebtoken';
import { config } from './config';

export interface JWTPayload {
    sub: string;
    email: string;
    name: string;
    roles: string[];
    iat?: number;
    exp?: number;
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}

export function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.auth.jwtSecret, {
        expiresIn: '7d'
    });
}

export function extractBearerToken(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}