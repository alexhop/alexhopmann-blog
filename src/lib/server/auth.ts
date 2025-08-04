import jwt from 'jsonwebtoken';
import { config } from '$lib/config';
import type { User } from '$lib/types';
import { getContainer } from './cosmos';

export interface TokenPayload {
	userId: string;
	email: string;
	name: string;
	roles: string[];
}

export function generateToken(user: User): string {
	const payload: TokenPayload = {
		userId: user.id,
		email: user.email,
		name: user.name,
		roles: user.roles
	};
	
	return jwt.sign(payload, config.auth.jwtSecret, {
		expiresIn: '7d'
	});
}

export function verifyToken(token: string): TokenPayload | null {
	try {
		return jwt.verify(token, config.auth.jwtSecret) as TokenPayload;
	} catch {
		return null;
	}
}

export async function getUserByEmail(email: string): Promise<User | null> {
	const container = await getContainer('users');
	
	const { resources } = await container.items
		.query<User>({
			query: 'SELECT * FROM c WHERE c.email = @email',
			parameters: [{ name: '@email', value: email }]
		})
		.fetchAll();
	
	return resources.length > 0 ? resources[0] : null;
}

export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
	const container = await getContainer('users');
	
	const user: User = {
		...userData,
		id: generateId(),
		createdAt: new Date(),
		updatedAt: new Date()
	};
	
	const { resource } = await container.items.create(user);
	return resource!;
}

export async function updateUser(id: string, email: string, updates: Partial<User>): Promise<User> {
	const container = await getContainer('users');
	
	// Users container uses /id as partition key
	const { resource: existingUser } = await container.item(id, id).read<User>();
	if (!existingUser) {
		throw new Error('User not found');
	}
	
	const updatedUser = {
		...existingUser,
		...updates,
		id: existingUser.id,
		email: existingUser.email,
		updatedAt: new Date()
	};
	
	const { resource } = await container.item(id, id).replace(updatedUser);
	return resource!;
}

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function hasRole(user: User | TokenPayload, role: string): boolean {
	return user.roles.includes(role) || user.roles.includes('admin');
}

export function isAdmin(user: User | TokenPayload): boolean {
	return user.roles.includes('admin');
}

export async function authenticate(event: any): Promise<User | null> {
	const token = event.cookies.get('auth-token');
	if (!token) return null;
	
	const payload = verifyToken(token);
	if (!payload) return null;
	
	return getUserByEmail(payload.email);
}